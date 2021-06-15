import express from 'express';
import {
    PriceFeedRequest,
    isInvalidComparison,
    executeChainlinkRequest
} from '../helpers';

export function createInitiatorRouter() {
    const router = express.Router();
    router.use(express.json());

    router.post('/', async (req, res) => {
        if(isInvalidComparison(req)) {
            res.status(500).json({
                status: 500,
                message: 'bad request body'
            });
            return;
        }

        const value_of = String(req.body.value_of).toUpperCase();
        const value_in = String(req.body.value_in).toUpperCase();
        const payload_data = (req.body.data) ? req.body.data : {};
        const compareURL = 'https://min-api.cryptocompare.com/data/price?fsym='+value_of+'&tsyms='+value_in;

        const data: PriceFeedRequest = {
            get: compareURL,
            path: value_in,
            payload: payload_data
        };

        try {
            const response = await executeChainlinkRequest(String(process.env.TEST_JOB_ID), data);
            res.status(200).send(response);
        } catch (err) {
            res.send(err);
        }
    })

    return router;
};