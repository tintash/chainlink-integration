import express from 'express';
import { processNewBlock } from '../initiator';
import { CoreNodeBlockMessage } from '../event-stream/core-node-message';
import {
  broadcastTransaction,
  ChainID,
  makeContractCall,
  TxBroadcastResultRejected,
} from '@stacks/transactions';
import {
  bufferToHexPrefixString,
  createDirectRequestTxOptions,
  getStacksNetwork,
  hexToDirectRequestParams,
  paramsToHexPrefixString,
} from '../helpers';
import { MockRequests } from '../mock/direct-requests';

export function createObserverRouter() {
  const router = express.Router();
  router.use(express.json());

  router.post('/new_block', (req, res) => {
    const core_message: CoreNodeBlockMessage = req.body;
    const _ = processNewBlock(ChainID.Testnet, core_message);
    res.sendStatus(200).end();
  });

  router.post('/new_burn_block', (req, res) => {
    res.sendStatus(200);
  });

  router.post('/new_mempool_tx', (req, res) => {
    res.sendStatus(200);
  });

  router.post('/drop_mempool_tx', (req, res) => {
    res.sendStatus(200);
  });

  // For testing purposes only, to be removed
  router.get('/consumer-test', async (req, res) => {
    const network = getStacksNetwork();
    const id = req.query.id === undefined ? 0 : parseInt(String(req.query.id));
    const txOptions = createDirectRequestTxOptions(network, MockRequests[id]);
    try {
      const transaction = await makeContractCall(txOptions);
      const broadcastResult = await broadcastTransaction(transaction, network);
      const txRejected = broadcastResult as TxBroadcastResultRejected;
      const error = txRejected.error;
      if (error) {
        res
          .status(400)
          .json({ msg: error + ' with reason: ' + txRejected.reason })
          .end();
      }
      res.status(200).json({
        txid: transaction.txid(),
      });
    } catch (err: any) {
      res.status(400).json({ msg: err.message });
    }
  });

  router.post('/create-buff', (req, res) => {
    const elements: { [name: string]: string } = {};
    Object.keys(req.body).map((key, _) => {
      const value = req.body[key].toString();
      if (value && value !== 'undefined') elements[key] = value;
    });

    if (Object.keys(elements).length === 0) res.status(400).json({ msg: 'bad request body' });

    try {
      const result = paramsToHexPrefixString(elements);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json(err.message);
    }
  });

  router.post('/decode-buff', (req, res) => {
    const buf_string = req.body.buffer;
    if (buf_string === 'undefined' || typeof buf_string != 'string')
      res.status(400).json({ msg: 'bad request body' });
    try {
      const result = hexToDirectRequestParams(buf_string);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json(err.message);
    }
  });

  router.post('/key-to-buff', (req, res) => {
    const key = req.body.key;
    if (key === 'undefined' || typeof key != 'string')
      res.status(400).json({ msg: 'bad request body' });
    try {
      const result = bufferToHexPrefixString(Buffer.from(key));
      res.status(200).json({
        key: key,
        buffer: result,
      });
    } catch (err: any) {
      res.status(400).json(err.message);
    }
  });

  router.use((req, res, next) => {
    const ei_ci_acckey = req.headers['x-chainlink-ea-accesskey'];
    const ei_ci_secret = req.headers['x-chainlink-ea-secret'];
    if (typeof ei_ci_acckey !== undefined && typeof ei_ci_secret !== undefined) {
      if (
        ei_ci_acckey === String(process.env.EI_CI_ACCESSKEY) &&
        ei_ci_secret === String(process.env.EI_CI_SECRET)
      ) {
        res
          .status(200)
          .json({
            status: 200,
            message: 'Success',
          })
          .end();
        return;
      }
    }
    res
      .status(404)
      .json({
        status: 404,
        message: 'Not Found',
      })
      .end();
  });

  return router;
}
