import express from 'express';
import { serveCallbackToStacksNode } from '../helpers';

export function createAdapterRouter() {
    const router = express.Router();
    router.use(express.json());

    router.post('/', async (req, res) => {
        console.log(req.body);
        const price = parseFloat(req.body.data.result);
        console.log(req.body.data);
        res.status(200).json({
            symbol: "ETH-USD",
            value: price,
            data: req.body.data
        });
        serveCallbackToStacksNode(req.body.data);
    });

    return router;
};