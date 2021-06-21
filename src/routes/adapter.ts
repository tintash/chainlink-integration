import { ChainID } from '@stacks/transactions';
import express from 'express';
import { ChainlinkFulfillmentResponse, createOracleFulfillmentTx, parseOracleRequestValue } from '../adapter-helpers';

export function createAdapterRouter() {
    const router = express.Router();
    router.use(express.json());

    router.post('/', async (req, res) => {
        try {
            console.log('Sajjad-> chainlink route');
            console.log('Sajjad-> ', req.body.data.encoded_data);
            const price = parseFloat(req.body.data.result);
            const fulfillment = parseOracleRequestValue(req.body.data.encoded_data);
            const linkFulfillment: ChainlinkFulfillmentResponse = {
                result: req.body.result,
                fulfillment: fulfillment,
            };
            const response = await createOracleFulfillmentTx(linkFulfillment, ChainID.Testnet);
            const txid = response.txid();
            res.status(200).json({ 
                symbol: "ETH-USD",
                value: price,
                data: req.body.data,
                txid: txid 
            });
        } catch (err) {
            res.status(500).json({ msg: err.message });
        }
    });

    return router;
};