import express from 'express';
import { requestEthereumPrice } from '../middleware/testConsumerMware';

export function createConsumerRouter() {
  const router = express.Router();
  router.use(express.json());

  router.post('/etherPrice', async (req, res) => {
    try {
      let oracleAddress = req.body.oracleAddress;
      let jobId = req.body.jobId;
      if (!oracleAddress || oracleAddress.length != 42 || !jobId) {
        res.status(400).json({ msg: `Invalid Parameters` });
      }
      const response: any = await requestEthereumPrice(oracleAddress, jobId);
      if (response.status == true && response.error.status == false) {
        res.status(200).json(response);
      } else if (response.false == false && response.error.status == true) {
        res.status(200).json(response);
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  return router;
}
