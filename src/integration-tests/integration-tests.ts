import fs from 'fs';
import path from 'path';
import { ClarityType } from '@stacks/transactions';
import { StacksMocknet } from '@stacks/network';
import { getChainlinkClientSessionCookie } from '../initiator-helpers';
import { connectWebSocketClient, StacksApiWebSocketClient } from '@stacks/blockchain-api-client';
import dotenv from 'dotenv';
import { MockRequests } from '../mock/direct-requests';

import {
  pingStacksBlockchainApi,
  deployContracts,
  isJobIdValid,
  callConsumerContract,
  completedJobRun,
  subscribeAddressTransactions,
  subscribeTxStatusChange,
  callContractReadOnlyFunction,
} from './helpers';

const CLARITY_CONTRACTS_PATH = '../../contracts/clarity/contracts';
const CONTRACT_NAMES = [
  'oracle',
  'ft-trait',
  'restricted-token-trait',
  'stxlink-token',
  'direct-request',
];

describe('Integration testing', () => {
  let chainlinkCookie: string = '';
  let client = {} as StacksApiWebSocketClient;
  beforeAll(async () => {
    try {
      console.log('Waiting for stacks-blockchian-api at localhost:3999');
      const status = await pingStacksBlockchainApi();
      console.log(`stacks-blockchian-api is up. Listening at localhost:3999`);

      client = await connectWebSocketClient(`ws://localhost:3999`);

      console.log('Deploying smart contracts');
      const deployTxs = await deployContracts(CONTRACT_NAMES, CLARITY_CONTRACTS_PATH);
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

  test(`Success: get consumer's requested value`, async () => {
    // call consumer contract to initiate request
    await callConsumerContract(MockRequests[0]);
    // wait for transaction status to be complete
    await subscribeAddressTransactions('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', client);
    // read fulfilled value by call read-only function
    const result = await callContractReadOnlyFunction(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'direct-request',
      'read-data-value',
      new StacksMocknet(),
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    // contarct read-data-value result should be ok
    expect(result.type).toBe(ClarityType.ResponseOk);
    expect(result.type === ClarityType.ResponseOk ? result.value.type : undefined).toBe(
      ClarityType.OptionalSome
    );
  });

  test(`Success: post consumer's requested value`, async () => {
    // call consumer contract to initiate request
    await callConsumerContract(MockRequests[2]);
    // wait for transaction status to be complete
    await subscribeAddressTransactions('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', client);
    // read fulfilled value by call read-only function
    const result = await callContractReadOnlyFunction(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'direct-request',
      'read-data-value',
      new StacksMocknet(),
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    // contarct read-data-value result should be ok
    expect(result.type).toBe(ClarityType.ResponseOk);
    expect(result.type === ClarityType.ResponseOk ? result.value.type : undefined).toBe(
      ClarityType.OptionalSome
    );
  });

  test('Error: direct-request wrong url', async () => {
    const jobRunIndex = 2;
    const mockRequest = { ...MockRequests[0], params: { get: 'https://examplewebsite.com' } };
    // call consumer contract to initiate request
    await callConsumerContract(mockRequest);
    // const isvalid = isJobIdValid(mockRequest['job-id'](), chainlinkCookie);
    // ckeck for valid job-id
    expect(await isJobIdValid(mockRequest['job-id'](), chainlinkCookie)).toBe(true);
    await expect(completedJobRun(chainlinkCookie, jobRunIndex)).rejects.toThrow();
  });

  test('Error: direct-request wrong job-id', async () => {
    const jobId = () => '1234';
    const mockRequest = { ...MockRequests[0], 'job-id': jobId };
    // call consumer contract to initiate request
    await callConsumerContract(mockRequest);
    // ckeck for valid job-id
    await expect(isJobIdValid(jobId(), chainlinkCookie)).rejects.toThrow();
  });
});
