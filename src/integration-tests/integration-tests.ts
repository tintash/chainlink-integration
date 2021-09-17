import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  StacksTransaction,
  TxBroadcastResultRejected,
  getNonce,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { StacksMocknet } from '@stacks/network';
import { getChainlinkClientSessionCookie } from '../initiator-helpers';
import { connectWebSocketClient, StacksApiWebSocketClient } from '@stacks/blockchain-api-client';

const CLARITY_CONTRACTS_PATH = '../../contracts/clarity/contracts';
const CONTRACT_NAMES = [
  'ft-trait',
  // 'restricted-token-trait',
  // 'stxlink-token',
  // 'oracle',
  // 'direct-request',
];

const txStatusMap: Map<string, { unsubscribe(): Promise<void> }> = new Map();

async function pingStacksBlockchainApi(): Promise<number> {
  let status: number = 0;
  while (status !== 200) {
    status = await fetch('http://localhost:3999').then(response => response.status);
  }
  return status;
}

async function deployContracts(
  contracts: string[],
  contractsPath: string,
  client: StacksApiWebSocketClient
): Promise<string[]> {
  console.log('Line 82');
  const network = new StacksMocknet();
  console.log('Line 84');
  const nonce = await getNonce(String(process.env.STX_ADDR), network);
  console.log('Line 86');

  try {
    const txs = await Promise.all(
      contracts.map((name, index) =>
        deployContract(name, contractsPath, network, nonce + BigInt(index), client)
      )
    );

    console.log('maps1: ', txStatusMap, txStatusMap.size);
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
  console.log('Line 42');
  const tx = await makeContractDeploy({
    contractName: contract.toString(),
    codeBody: fs.readFileSync(path.join(__dirname, `${contractsPath}/${contract}.clar`)).toString(),
    senderKey: String(process.env.STX_ADDR_PRIVATE_KEY),
    network,
    anchorMode: AnchorMode.Any,
    nonce: nonce,
  });
  const broadcastResult = await broadcastTransaction(tx, network);
  const txRejected = broadcastResult as TxBroadcastResultRejected;
  const error = txRejected.error;
  if (error) {
    throw new Error(`${error} with reason: ${txRejected.reason}`);
  }
  // const sub = await client.subscribeTxUpdates(tx.txid(), async event => {
  //   console.log('event: ', event);
  //   if (event.tx_status !== 'pending') {
  //     const subscription = txStatusMap.get(event.tx_id);
  //     if (subscription) {
  //       await subscription.unsubscribe();
  //       console.log('event.tx_status: ', event.tx_status);
  //       txStatusMap.delete(event.tx_id);
  //     }
  //   }
  // });
  // console.log('Line 75');
  // txStatusMap.set(tx.txid(), sub);
  // console.log('maps0: ', txStatusMap);
  return tx;
}

describe('Integration testing', () => {
  let chainlinkCookie: string = '';
  beforeAll(async () => {
    try {
      const client = await connectWebSocketClient(`ws://localhost:3999`);

      console.log('Waiting for stacks-blockchian-api at localhost:3999');
      let stxApiStatus = await pingStacksBlockchainApi();
      console.log(`stacks-blockchian-api status is ${stxApiStatus}. Listening at localhost:3999`);

      // console.log('Deploying smart contracts');
      // const deployTxs = await deployContracts(CONTRACT_NAMES, CLARITY_CONTRACTS_PATH, client);
      // console.log(`Successfully deployed all contracts, txids:`, deployTxs);

      await client.subscribeAddressTransactions(String(process.env.STX_ADDR), event => {
        console.log('event.tx_id', event.tx_id + ': ' + event.tx_status);
      });

      while (true) {
        const tx = await makeContractDeploy({
          contractName: 'ft-trait',
          codeBody: fs
            .readFileSync(path.join(__dirname, `${CLARITY_CONTRACTS_PATH}/ft-trait.clar`))
            .toString(),
          senderKey: String(process.env.STX_ADDR_PRIVATE_KEY),
          network: new StacksMocknet(),
          anchorMode: AnchorMode.Any,
        });
        const broadcastResult = await broadcastTransaction(tx, new StacksMocknet());
        const txRejected = broadcastResult as TxBroadcastResultRejected;
        const error = txRejected.error;
        if (error) {
          throw new Error(`${error} with reason: ${txRejected.reason}`);
        }
        break;
      }

      // while (true) {

      // while (true) {}
      // }
      // console.log('Getting Chainlink session cookie');
      // chainlinkCookie = await getChainlinkClientSessionCookie();
    } catch (error) {
      throw error;
    }
  });

  test('dummy test', () => {});
  // test('testing direct-request sample resuest 1', async () => {
  //   try {
  //     console.log('mapSize: ', txStatusMap.size);

  //     // while (txStatusMap.size > 0) {
  //     //   console.log('mapSize: ', txStatusMap.size);
  //     //   console.log('map: ', txStatusMap);
  //     // }
  //     const txid = await fetch('http://localhost:3000/consumer-test?id=0')
  //       .then(response => response.json())
  //       .then(response => response)
  //       .catch(error => {
  //         throw error;
  //       });
  //     let jobRunStatus: string = '';
  //     console.log('txid', txid);

  //     // while (jobRunStatus !== 'completed')
  //     jobRunStatus = await fetch(`http://localhost:6688/v2/runs?id=${txid}`, {
  //       method: 'GET',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         cookie: chainlinkCookie,
  //       },
  //     })
  //       .then(response => response.json())
  //       .then(response => response);
  //   } catch (error) {
  //     throw error;
  //   }
  //   console.log('Job has completed successfully');
  // });
});
