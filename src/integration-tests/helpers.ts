import fs from 'fs';
import path from 'path';
import { StacksApiWebSocketClient } from '@stacks/blockchain-api-client';
import { StacksMocknet, StacksNetwork } from '@stacks/network';
import {
  AnchorMode,
  standardPrincipalCVFromAddress,
  UIntCV,
  broadcastTransaction,
  callReadOnlyFunction,
  getNonce,
  makeContractCall,
  makeContractDeploy,
  StacksTransaction,
  TxBroadcastResultRejected,
  standardPrincipalCV,
  uintCV,
} from '@stacks/transactions';
import { createDirectRequestTxOptions } from '../helpers';

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

export async function pingStacksBlockchainApi(): Promise<number> {
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

export async function deployContracts(
  contracts: string[],
  contractsPath: string
): Promise<string[]> {
  const network = new StacksMocknet();
  const nonce = await getNonce(String(process.env.STX_ADDR), network);
  try {
    const txs = await Promise.all(
      contracts.map((name, index) =>
        deployContract(name, contractsPath, network, nonce + BigInt(index))
      )
    );
    return txs.map(tx => tx.txid());
  } catch (error) {
    throw error;
  }
}

export async function deployContract(
  contract: String,
  contractsPath: string,
  network: StacksNetwork,
  nonce: bigint
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

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function subscribeTxStatusChange(
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

export async function subscribeAddressTransactions(
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

export async function callConsumerContract(mockRequest: any): Promise<StacksTransaction> {
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

export async function addMinterRole(): Promise<StacksTransaction> {
  try {
    const network = new StacksMocknet();
    const txOptions = addMinterRoleTxOptions(network);
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

export async function mintStxLink(): Promise<StacksTransaction> {
  try {
    const network = new StacksMocknet();
    const txOptions = mintTxOptions(network);
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

function addMinterRoleTxOptions(network: StacksNetwork) {
  const stxLinkTokenAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

 
  const txOptions = {
    contractAddress: stxLinkTokenAddress,
    contractName: 'stxlink-token',
    functionName: 'add-principal-to-role',
    functionArgs: [
      uintCV(4),
      standardPrincipalCV(stxLinkTokenAddress),
    ],
    senderKey: String(process.env.STX_ADDR_PRIVATE_KEY),
    validateWithAbi: true,
    network,
    anchorMode: 1,
  };
  return txOptions;
}

function mintTxOptions(network: StacksNetwork) {
  const stxLinkTokenAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

 
  const txOptions = {
    contractAddress: stxLinkTokenAddress,
    contractName: 'stxlink-token',
    functionName: 'mint-tokens',
    functionArgs: [
      uintCV(2000),
      standardPrincipalCV('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6'),
    ],
    senderKey: String(process.env.STX_ADDR_PRIVATE_KEY),
    validateWithAbi: true,
    network,
    anchorMode: 1,
  };
  return txOptions;
}

export async function callContractReadOnlyFunction(
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

export async function isJobIdValid(jobId: string, cookie: string): Promise<boolean> {
  try {
    return await fetch(`http://${String(process.env.CHAINLINK_HOST)}:6688/v2/specs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
    })
      .then(response => response.json())
      .then(res => (res.data ? res.data.id == jobId : false));
  } catch (error) {
    throw error;
  }
}

export async function completedJobRun(
  chainlinkCookie: string,
  jobRunIndex: number
): Promise<JobRun> {
  try {
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
