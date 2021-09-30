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
  addMinterRole,
  mintStxLink,
} from './helpers';

const CLARITY_CONTRACTS_PATH = '../../contracts/clarity/contracts';
const CONTRACT_NAMES = [
  'oracle-callback-trait',
  'oracle-trait',
  'stxlink-transfer-trait',
  'ft-trait',
  'restricted-token-trait',
  'stxlink-token',
  'oracle',
  'direct-request',
];
const STACKS_CORE_API_WS_URL = 'ws://localhost:3999';
const ENV_FILE_PATH = '../../.env';

describe('Integration testing', () => {
  let chainlinkCookie: string = '';
  let client = {} as StacksApiWebSocketClient;
  beforeAll(async () => {
    try {
      await pingStacksBlockchainApi();
      client = await connectWebSocketClient(STACKS_CORE_API_WS_URL);
      chainlinkCookie = await getChainlinkClientSessionCookie();

      const deployTxs = await deployContracts(CONTRACT_NAMES, CLARITY_CONTRACTS_PATH);
      await Promise.all(deployTxs.map(async txId => subscribeTxStatusChange(txId, client)));

      const envFile = fs.readFileSync(path.join(__dirname, ENV_FILE_PATH));
      const envConfig = dotenv.parse(envFile);
      for (const key in envConfig) {
        process.env[key] = envConfig[key];
      }
      await addMinterRole();
      await mintStxLink();
    } catch (error) {
      throw error;
    }
  });

  test(`Success: get consumer's requested value`, async () => {
    // call consumer contract to initiate request
    await callConsumerContract(MockRequests[0]);
    // ckeck for valid job-id
    expect(await isJobIdValid(MockRequests[0]['job-id'](), chainlinkCookie)).toBe(true);
    // wait for transaction status to be complete
    await subscribeAddressTransactions(String(process.env.STX_ADDR), client);
    // read fulfilled value by call read-only function
    const result = await callContractReadOnlyFunction(
      String(process.env.STX_ADDR),
      'direct-request',
      'read-data-value',
      new StacksMocknet(),
      String(process.env.STX_ADDR)
    );
    // contarct read-data-value result type should not be None
    expect(result.type).toBe(ClarityType.OptionalSome);
    // contarct read-data-value result value should be of Buffer type
    expect(result.type === ClarityType.OptionalSome ? result.value.type : undefined).toBe(
      ClarityType.Buffer
    );
  });

  test(`Success: post consumer's requested value`, async () => {
    // call consumer contract to initiate request
    await callConsumerContract(MockRequests[2]);
    // ckeck for valid job-id
    expect(await isJobIdValid(MockRequests[2]['job-id'](), chainlinkCookie)).toBe(true);
    // wait for transaction status to be complete
    await subscribeAddressTransactions(String(process.env.STX_ADDR), client);
    // read fulfilled value by call read-only function
    const result = await callContractReadOnlyFunction(
      String(process.env.STX_ADDR),
      'direct-request',
      'read-data-value',
      new StacksMocknet(),
      String(process.env.STX_ADDR)
    );
    // contarct read-data-value result type should not be None
    expect(result.type).toBe(ClarityType.OptionalSome);
    // contarct read-data-value result value should be of Buffer type
    expect(result.type === ClarityType.OptionalSome ? result.value.type : undefined).toBe(
      ClarityType.Buffer
    );
  });

  test('Error: direct-request wrong url', async () => {
    const jobRunIndex = 2;
    const mockRequest = { ...MockRequests[0], params: { get: 'https://examplewebsite.com' } };
    // call consumer contract to initiate request
    await callConsumerContract(mockRequest);
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
    expect(await isJobIdValid(jobId(), chainlinkCookie)).toBe(false);
  });

  afterAll(() => {
    client.webSocket.close();
  });
});
