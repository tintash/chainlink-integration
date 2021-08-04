import {
  bufferCV,
  ChainID,
  ContractPrincipalCV,
  StandardPrincipalCV,
  uintCV,
} from '@stacks/transactions';
import { PoolClient } from 'pg';
import {
  ChainlinkFulfillmentResponse,
  createOracleFulfillmentTx,
  OracleFulfillment,
} from '../adapter-helpers';
import { PgDataStore, OracleRequestQueryResult } from '../datastore/postgres-store';

export async function processEVMFulfullmentEvent(evmRequestId: string, evmResult: string) {
  try {
    // await cycleMigrations();
    // console.log('EVM_REQ_ID: ' + evmRequestId);
    console.log('adapter evm-req-id: ---- : ' + evmRequestId);

    const db: PgDataStore = await PgDataStore.connect();
    const client: PoolClient = await db.pool.connect();
    const oracleQueryResult = await db.getOracleRequest(evmRequestId);
    console.log(oracleQueryResult);
    if (!oracleQueryResult.found) {
      throw new Error('|CHAINLINK-EVM-ADAPTER| request not found in database');
    }
    const linkFulfillment: ChainlinkFulfillmentResponse = {
      result: evmResult,
      fulfillment: queryResultToOracleFulfillment(oracleQueryResult.result),
    };
    const response = await createOracleFulfillmentTx(linkFulfillment, ChainID.Testnet);
    const txid = response.txid();
    console.log('|CHAINLINK-EVM-ADAPTER| 0x' + txid);
    return {
      value: evmResult,
      txid: txid,
    };
  } catch (err) {
    console.log('|CHAINLINK-EVM-ADAPTER| [ERROR] with message:', err);
  }
}

export function queryResultToOracleFulfillment(
  queryResult: OracleRequestQueryResult
): OracleFulfillment {
  const fulfillment: OracleFulfillment = {
    request_id: bufferCV(queryResult.request_id),
    expiration: uintCV(queryResult.expiration),
    sender: JSON.parse(queryResult.sender) as StandardPrincipalCV,
    payment: uintCV(queryResult.payment),
    spec_id: bufferCV(queryResult.spec_id),
    callback: JSON.parse(queryResult.callback) as ContractPrincipalCV,
    nonce: uintCV(queryResult.nonce),
    data_version: uintCV(queryResult.data_version),
    request_count: uintCV(queryResult.request_count),
    sender_buff: bufferCV(queryResult.sender_buff),
    data: bufferCV(queryResult.data),
  };
  return fulfillment;
}
