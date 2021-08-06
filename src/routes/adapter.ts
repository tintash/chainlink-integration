import { ChainID } from '@stacks/transactions';
import express from 'express';
import {
  ChainlinkFulfillmentResponse,
  createOracleFulfillmentTx,
  parseOracleRequestValue,
} from '../adapter-helpers';

export function createAdapterRouter() {
  const router = express.Router();
  router.use(express.json());

  router.post('/', async (req, res) => {
    try {
      console.log('Chainlink Callback Body:< ', req.body, ' >');
      const result = String(req.body.data.result);
      const fulfillment = parseOracleRequestValue(req.body.data.payload);
      const linkFulfillment: ChainlinkFulfillmentResponse = {
        result: result,
        fulfillment: fulfillment,
      };
      const response = await createOracleFulfillmentTx(linkFulfillment, ChainID.Testnet);
      const txid = response.txid();
      console.log('Chainlink Adapter Callback Tx:< 0x' + txid + ' >');
      res.status(200).json({
        value: result,
        data: req.body.data,
        txid: txid,
      });
    } catch (err: any) {
      res.status(500).json({ msg: err.message });
    }
  });

  return router;
}
