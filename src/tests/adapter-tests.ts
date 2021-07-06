import { App } from "../app";
import supertest from 'supertest';
import * as StacksTransactions from '@stacks/transactions';
import * as AdapterApiHelper from '../adapter-helpers';
import { StacksTransaction } from "@stacks/transactions";


let apiServer = App;
describe('adapter tests', () => {

    test('adapter test', async () => {
        const query1 = await supertest(apiServer).post('/adapter');
        expect(query1.status).toBe(500);
    });

    test('success: adapter call', async () => {
       
        const expected = '0x023455'
        Object.defineProperty(AdapterApiHelper, 'createOracleFulfillmentTx', {
            value: jest.fn().mockImplementation(() => expected),
        });

        const query = await supertest(apiServer).post('/adapter').send({
            id: "53e50ee0-3014-40d9-bc60-ce83d40eefed",
            data: {
              get: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD",
              path: "USD",
              payload: "0x0c000000090863616c6c6261636b061a888a0a096bd302b3a4130616c00458e243ee533708636f6e73756d6572046461746102000000567b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d0c646174612d76657273696f6e01000000000000000000000000000000000a65787069726174696f6e01000000000000000000000000000f423f056e6f6e63650100000000000000000000000000000000077061796d656e74010000000000000000000000000000012c0a726571756573742d696401000000000000000000000000000000010673656e646572051a888a0a096bd302b3a4130616c00458e243ee533707737065632d69640200000042307833333334333436363634333933343336333836353631333633343337363233383338363333353330333336343631363333383330333833323633333036313334",
              result: 2282.04
            }
        });

        const expectedResponse = {
            value: '2282.04',
            data: {
              get: 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
              path: 'USD',
              payload: '0x0c000000090863616c6c6261636b061a888a0a096bd302b3a4130616c00458e243ee533708636f6e73756d6572046461746102000000567b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d0c646174612d76657273696f6e01000000000000000000000000000000000a65787069726174696f6e01000000000000000000000000000f423f056e6f6e63650100000000000000000000000000000000077061796d656e74010000000000000000000000000000012c0a726571756573742d696401000000000000000000000000000000010673656e646572051a888a0a096bd302b3a4130616c00458e243ee533707737065632d69640200000042307833333334333436363634333933343336333836353631333633343337363233383338363333353330333336343631363333383330333833323633333036313334',
              result: 2282.04
            },
            txid: '0x023455'
          };
        expect(JSON.parse(query.text)).toEqual(expectedResponse);
    });

    test('failure: payload is required in adapter', async () => {
       
        const expected = '0x023455'
        Object.defineProperty(AdapterApiHelper, 'createOracleFulfillmentTx', {
            value: jest.fn().mockImplementation(() => expected),
        });

        const query = await supertest(apiServer).post('/adapter').send({
            id: "53e50ee0-3014-40d9-bc60-ce83d40eefed",
            data: {
              get: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD",
              path: "USD",
              result: 2282.04
            }
        });

        expect(query.status).toBe(500);
    });

   
    
});

