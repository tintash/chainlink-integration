import { PoolClient } from 'pg';
import { OracleFulfillment, parseOracleRequestValue } from '../adapter-helpers';
import { cycleMigrations, PgDataStore } from '../datastore/postgres-store';
import { bufferCVToASCIIString, DirectRequestParams, hexToDirectRequestParams } from '../helpers';
import { EVMResponse, DirectRequestType } from './evm-constants';
import { getRequest } from './evm-helper';

export async function initiateEVMRequest(encoded_data: string) {
  try {
    const oracleTopicData = parseOracleRequestValue(encoded_data);
    const evmTxId = await requestChainlink(oracleTopicData);
    console.log('|CHAINLINK-EVM-INITIATOR| EVM transaction hash: ', evmTxId);
  } catch (err) {
    console.log('|CHAINLINK-EVM-INITIATOR| [ERROR] with message:', err);
  }
}

export async function requestChainlink(oracleTopicData: OracleFulfillment): Promise<string> {
  const jobId = bufferCVToASCIIString(oracleTopicData.spec_id);
  const paramHex = oracleTopicData.data.buffer.toString();
  const params: DirectRequestParams = await hexToDirectRequestParams(paramHex);
  const urlPath = params.get !== undefined ? params.get : params.post;
  if (urlPath === undefined) {
    throw new Error('invalid direct request parameters.');
  }
  const requestType: DirectRequestType =
    params.get !== undefined ? DirectRequestType.GET : DirectRequestType.POST;
  const evmResponse = await makeEVMContractCall(jobId, requestType, urlPath, params.path);
  const db: PgDataStore = await PgDataStore.connect();
  const client: PoolClient = await db.pool.connect();
  await db.updateOracleRequest(oracleTopicData, evmResponse.requestId);
  return evmResponse.txHash;
}

export async function makeEVMContractCall(
  jobId: string,
  requestType: DirectRequestType,
  url: string,
  decodePath: string
): Promise<EVMResponse> {
  const oracleAddr = String(process.env.ETHEREUM_CHAINLINK_ORACLE_CONTRACT);
  let result: EVMResponse;
  switch (requestType) {
    case DirectRequestType.POST:
      result = await getRequest(oracleAddr, jobId, url, decodePath);
    case DirectRequestType.GET:
      result = await getRequest(oracleAddr, jobId, url, decodePath);
  }
  return result;
}
