import { App } from "../app";
import { PgDataStore, cycleMigrations, runMigrations } from '../datastore/postgres-store';
import supertest from 'supertest';
import { Client, PoolClient } from "pg";
import { OracleFulfillment } from "../adapter-helpers";
import { bufferCVFromString, contractPrincipalCV, standardPrincipalCV, StandardPrincipalCV, uintCV } from "@stacks/transactions";

let apiServer = App;
describe('datastore tests', () => {
    let db: PgDataStore;
    let client: PoolClient;

    beforeEach(async () => {
        // process.env.PG_DATABASE = 'postgres';
        // await cycleMigrations();
        db = await PgDataStore.connect();
        client = await db.pool.connect();
    });

    test('oracle request table', async () => {
        const evmRequestId = '0xfasdf2e1231asfdasdf';
        const oracleData: OracleFulfillment = {
            request_id: bufferCVFromString('0xfasdf2e1231asfdasdf'),
            expiration: uintCV(1),
            sender: standardPrincipalCV('ST3X3TP269TNNGT3EQKF3JY1TK2M343FMZ8BNMV0G'),
            payment: uintCV(300),
            spec_id: bufferCVFromString('0x3863343061383562623662663466383361613065396630373730613230633536'),
            callback: contractPrincipalCV('ST3X3TP269TNNGT3EQKF3JY1TK2M343FMZ8BNMV0G','oracle'),
            nonce: uintCV(1),
            data_version: uintCV(1),
            request_count: uintCV(1),
            sender_buff: bufferCVFromString('0x3863343061383562623662663466383361613065396630373730613230633536'),
            data: bufferCVFromString('0x3863343061383562623662663466383361613065396630373730613230633536')
        };
        await db.updateOracleRequest(oracleData, evmRequestId);
        const result = await db.getOracleRequest(evmRequestId);
        console.log(result);
    });

    // test('or-test', async () => {
    //     const client = new Client({
    //         database: process.env['PG_DATABASE'],
    //         user: process.env['PG_USER'],
    //         password: process.env['PG_PASSWORD'],
    //         host: process.env['PG_HOST'],
    //         port: 5432
    //     });
        
    //     await client.connect();
        
    //     try {
    //         const result = await client.query(`SELECT * FROM oracle_request;`);
    //         console.log(result.rows);
    //         client.end();
    //     } catch (e) {
    //         console.error(e.stack);
    //         client.end();
    //     }
    // });
});
