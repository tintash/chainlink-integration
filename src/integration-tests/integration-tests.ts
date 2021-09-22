import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import {
  makeContractDeploy,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  StacksTransaction,
  TxBroadcastResultRejected,
  getNonce,
  callReadOnlyFunction,
  ClarityType,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { StacksMocknet } from '@stacks/network';
import { getChainlinkClientSessionCookie } from '../initiator-helpers';
import { connectWebSocketClient, StacksApiWebSocketClient } from '@stacks/blockchain-api-client';
import { createDirectRequestTxOptions } from '../helpers';
import dotenv from 'dotenv';
import { MockRequests } from '../mock/direct-requests';

const CLARITY_CONTRACTS_PATH = '../../contracts/clarity/contracts';
const CONTRACT_NAMES = [
  'oracle',
  'ft-trait',
  'restricted-token-trait',
  'stxlink-token',
  'direct-request',
];

export interface JobRun {
  data: Data;
}

export interface JobRuns {
  data: Data[];
}

export interface Data {
  attributes: Attributes;
}

export interface Attributes {
  id: string;
  jobId: string;
  result: Result;
  status: string;
}

export interface Result {
  data: ResultData;
  error: any;
}

export interface ResultData {
  get: string;
  post: string;
  path: string;
  result: any;
  body: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pingStacksBlockchainApi(): Promise<number> {
  try {
    const status = await fetch('http://localhost:3999').then(response => response.status);
    return status;
  } catch (error: any) {
    if (
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND'
    ) {
      return await pingStacksBlockchainApi();
    } else throw error;
  }
}

async function deployContracts(
  contracts: string[],
  contractsPath: string,
  client: StacksApiWebSocketClient
): Promise<string[]> {
  const network = new StacksMocknet();
  const nonce = await getNonce(String(process.env.STX_ADDR), network);

  try {
    const txs = await Promise.all(
      contracts.map((name, index) =>
        deployContract(name, contractsPath, network, nonce + BigInt(index), client)
      )
    );
    return txs.map(tx => tx.txid());
  } catch (error) {
    throw error;
  }
}

async function deployContract(
  contract: String,
  contractsPath: string,
  network: StacksNetwork,
  nonce: bigint,
  client: StacksApiWebSocketClient
): Promise<StacksTransaction> {
  const tx = await makeContractDeploy({
    contractName: contract.toString(),
    codeBody: fs.readFileSync(path.join(__dirname, `${contractsPath}/${contract}.clar`)).toString(),
    senderKey: String(process.env.STX_ADDR_PRIVATE_KEY),
    network,
    anchorMode: AnchorMode.Any,
    nonce,
  });
  const broadcastResult = await broadcastTransaction(tx, network);
  const txRejected = broadcastResult as TxBroadcastResultRejected;
  const error = txRejected.error;
  if (error) {
    throw new Error(`${error} with reason: ${txRejected.reason}`);
  }
  return tx;
}

async function subscribeTxStatusChange(
  txId: string,
  client: StacksApiWebSocketClient
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    await client.subscribeTxUpdates(txId, event => {
      if (event.tx_status === 'success') {
        resolve();
      } else if (event.tx_status !== 'pending') {
        reject();
      }
    });
  });
}

async function subscribeAddressTransactions(
  address: string,
  client: StacksApiWebSocketClient
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    await client.subscribeAddressTransactions(address, event => {
      if (event.tx_status === 'success') {
        resolve();
      } else if (event.tx_status !== 'pending') {
        reject();
      }
    });
  });
}

async function callConsumerContract(mockRequest: any): Promise<StacksTransaction> {
  try {
    const network = new StacksMocknet();
    const txOptions = createDirectRequestTxOptions(network, mockRequest);
    const transaction = await makeContractCall(txOptions);
    const broadcastResult = await broadcastTransaction(transaction, network);
    const txRejected = broadcastResult as TxBroadcastResultRejected;
    const error = txRejected.error;
    if (error) {
      throw new Error(`${error} with reason: ${txRejected.reason}`);
    }
    return transaction;
  } catch (error) {
    throw error;
  }
}

async function callContractReadOnlyFunction(
  contractAddress: string,
  contractName: string,
  functionName: string,
  network: StacksNetwork,
  senderAddress: string
) {
  // const buffer = bufferCVFromString('');
  const options = {
    contractAddress,
    contractName,
    functionName,
    functionArgs: [],
    network,
    senderAddress,
  };
  return await callReadOnlyFunction(options);
}

async function isJobIdValid(jobId: string, cookie: string): Promise<boolean> {
  try {
    return await fetch(`http://${String(process.env.CHAINLINK_HOST)}:6688/v2/specs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
    })
      .then(response => response.json())
      .then(res => res.data.id == jobId);
  } catch (error) {
    throw error;
  }
}

async function completedJobRun(
  jobId: string,
  jobRunIndex: number,
  chainlinkCookie: string
): Promise<JobRun> {
  try {
    await isJobIdValid(jobId, chainlinkCookie);

    let jobRunStatus: string = '';
    let run = {} as JobRun;
    while (jobRunStatus !== 'completed') {
      const response = await fetch(`http://localhost:6688/v2/runs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: chainlinkCookie,
        },
      });
      const jsonResponse: JobRuns = await response.json();
      if (jsonResponse.data.length > jobRunIndex) {
        jobRunStatus = jsonResponse.data[jobRunIndex].attributes.status;
        run.data = jsonResponse.data[jobRunIndex];
        if (jobRunStatus === 'errored') {
          throw new Error(run.data.attributes.result.error);
        }
      }
      await sleep(500);
    }
    return run;
  } catch (error) {
    throw error;
  }
}

describe('Integration testing', () => {
  let chainlinkCookie: string = '';
  let client = {} as StacksApiWebSocketClient;
  beforeAll(async () => {
    try {
      console.log('Waiting for stacks-blockchian-api at localhost:3999');
      await pingStacksBlockchainApi();
      console.log(`stacks-blockchian-api is up. Listening at localhost:3999`);

      client = await connectWebSocketClient(`ws://localhost:3999`);

      console.log('Deploying smart contracts');
      const deployTxs = await deployContracts(CONTRACT_NAMES, CLARITY_CONTRACTS_PATH, client);
      await Promise.all(deployTxs.map(async txId => subscribeTxStatusChange(txId, client)));
      console.log(`Successfully deployed all contracts, txids:`, deployTxs);

      console.log('Getting Chainlink session cookie');
      chainlinkCookie = await getChainlinkClientSessionCookie();
    } catch (error) {
      throw error;
    }

    console.log('Loading envionment variables');
    const envFile = fs.readFileSync(path.join(__dirname, '../../.env'));
    const envConfig = dotenv.parse(envFile);
    for (const key in envConfig) {
      process.env[key] = envConfig[key];
    }
  });

  afterAll(async () => {
    client.webSocket.close();
  });

  test('Success: check consumer request value', async () => {
    await callConsumerContract(MockRequests[0]);
    await subscribeAddressTransactions('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', client);
    const result = await callContractReadOnlyFunction(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'direct-request',
      'read-data-value',
      new StacksMocknet(),
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    expect(result.type).toBe(ClarityType.ResponseOk);
    expect(result.type === ClarityType.ResponseOk ? result.value.type : undefined).toBe(
      ClarityType.OptionalSome
    );
  });

  test('Error: direct-request wrong url', async () => {
    const jobRunIndex = 1;
    const mockRequest = {
      'job-id': () => String(process.env.CHAINLINK_GET_JOB_ID),
      params: {
        get: 'https://examplewebsite.com',
        path: 'USD',
      },
    };
    await callConsumerContract(mockRequest);
    await expect(
      completedJobRun(mockRequest['job-id'](), jobRunIndex, chainlinkCookie)
    ).rejects.toThrow();
  });

  test('Error: direct-request wrong job-id', async () => {
    const jobRunIndex = 0;
    const mockRequest = {
      'job-id': () => '1234',
      params: {
        get: 'https://examplewebsite.com',
        path: 'USD',
      },
    };
    await callConsumerContract(mockRequest);
    await expect(
      completedJobRun(mockRequest['job-id'](), jobRunIndex, chainlinkCookie)
    ).rejects.toThrow();
  });
});
