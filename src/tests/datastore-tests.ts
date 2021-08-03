import {
  PgDataStore,
  cycleMigrations,
  runMigrations,
  FoundOrNot,
  OracleRequestQueryResult,
} from '../datastore/postgres-store';
import { PoolClient } from 'pg';
import { OracleFulfillment } from '../adapter-helpers';
import {
  bufferCVFromString,
  ContractPrincipalCV,
  contractPrincipalCV,
  standardPrincipalCV,
  uintCV,
} from '@stacks/transactions';

describe('datastore tests', () => {
  let db: PgDataStore;
  let client: PoolClient;

  beforeEach(async () => {
    process.env.PG_DATABASE = 'postgres';
    await cycleMigrations();
    db = await PgDataStore.connect();
    client = await db.pool.connect();
  });

  test('oracle request table', async () => {
    const evmRequestId = '0xfasdf2e1231asfdasd';
    const oracleData: OracleFulfillment = {
      request_id: bufferCVFromString('0xfasdf2e1231asfdasd'),
      expiration: uintCV(3),
      sender: standardPrincipalCV('ST3X3TP269TNNGT3EQKF3JY1TK2M343FMZ8BNMV0G'),
      payment: uintCV(300),
      spec_id: bufferCVFromString(
        '0x3863343061383562623662663466383361613065396630373730613230633536'
      ),
      callback: contractPrincipalCV('ST3X3TP269TNNGT3EQKF3JY1TK2M343FMZ8BNMV0G', 'oracle'),
      nonce: uintCV(2),
      data_version: uintCV(3),
      request_count: uintCV(4),
      sender_buff: bufferCVFromString(
        '0x3863343061383562623662663466383361613065396630373730613230633536'
      ),
      data: bufferCVFromString(
        '0x3863343061383562623662663466383361613065396630373730613230633536'
      ),
    };
    await db.updateOracleRequest(oracleData, evmRequestId);
    const queryResult: FoundOrNot<OracleRequestQueryResult> = await db.getOracleRequest(
      evmRequestId
    );
    if (queryResult.found) {
      console.log(JSON.parse(queryResult.result.callback) as ContractPrincipalCV);
    }
  });

  afterEach(async () => {
    client.release();
    await db?.close();
    await runMigrations(undefined, 'down');
  });
});
