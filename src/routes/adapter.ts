import { ChainID } from '@stacks/transactions';
import express from 'express';
import { validate } from '../validate-helpers';
import { ChainlinkFulfillmentResponse, createOracleFulfillmentTx, parseOracleRequestValue } from '../adapter-helpers';
import {ResponseAdapter} from 'chainlink-integration-types';

const adapterRequestSchemaPath = 'chainlink-integration-types/api/adapter/post-request-adapter.schema.json';
export function createAdapterRouter() {
    const router = express.Router();
    router.use(express.json());

    router.post('/', async (req, res) => {
        try {
            console.log('Chainlink Callback Body:< ', req.body, ' >');
            
            const schemaValidation = await validate(adapterRequestSchemaPath, req.body);
            if(!schemaValidation.valid) {
                const error = schemaValidation.error? schemaValidation.error: 'Invalid Schema';
                res.status(500).json(error);
                return;
            }
            const {data} = req.body;
            const {result, payload} = data;
            const resultValue = String(result);
            const fulfillment = parseOracleRequestValue(payload);
            const linkFulfillment: ChainlinkFulfillmentResponse = {
                result: resultValue,
                fulfillment: fulfillment,
            };
            const txid = await createOracleFulfillmentTx(linkFulfillment, ChainID.Testnet);


            console.log('Chainlink Adapter Callback Tx:< 0x'+txid+' >');  

            const response: ResponseAdapter = {
                value: resultValue,
                data: data,
                txid: txid 
            };
            res.status(200).json(response);
        } catch (err) {
            res.status(500).json({ msg: err.message });
        }
    });
    
    return router;
};