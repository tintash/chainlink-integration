import { ChainID } from '@stacks/transactions';
import express from 'express';
import { ChainlinkFulfillmentResponse, createOracleFulfillmentTx, parseOracleRequestValue } from '../adapter-helpers';

export function createAdapterRouter() {
    const router = express.Router();
    router.use(express.json());

    router.post('/', async (req, res) => {
        try {
            console.log('Sajjad-> chainlink route');
            console.log('Sajjad-> ', req.body);
            const price = String(Math.round(parseFloat(req.body.data.result)*100));
            const fulfillment = parseOracleRequestValue(req.body.data.payload);
            const linkFulfillment: ChainlinkFulfillmentResponse = {
                result: price,
                fulfillment: fulfillment,
            };
            const txid = await createOracleFulfillmentTx(linkFulfillment, ChainID.Testnet);
            //const txid = response.txid();
            console.log('tx->', txid);
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