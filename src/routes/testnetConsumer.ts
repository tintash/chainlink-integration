import express from 'express';
import { getRequest } from '../middleware/stacksConsumer';

export function createConsumerRouter() {
  const router = express.Router();
  router.use(express.json());

  router.post('/etherPrice', async (req, res) => {
    try {
      const { oracleAddress, jobId, url, path } = req.body;
      if (!oracleAddress || oracleAddress.length != 42 || !jobId || !url || !path) {
        res.status(400).json({ msg: `Invalid Parameters` });
      }
      const response: any = await getRequest(oracleAddress, jobId, url, path);
      if (response.status == true) {
        res.status(200).json(response);
      }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  return router;
}
