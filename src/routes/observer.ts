import express from 'express';
import { serveCallbackToStacksNode } from '../helpers';

export function createObserverRouter() {
    const router = express.Router();
    router.use(express.json());

    router.post('/new_block', async (req, res) => {
        // console.log(req.body);
        res.sendStatus(200);
    });

    router.post('/new_burn_block', async (req, res) => {
        // console.log(req.body);
        res.sendStatus(200);
    });

    router.post('/new_mempool_tx', async (req, res) => {
        // console.log(req.body);
        res.sendStatus(200);
    });

    router.post('/drop_mempool_tx', async (req, res) => {
        // console.log(req.body);
        res.sendStatus(200);
    });

    router.use((req,res, next) => {
        const ei_ci_acckey = req.headers["x-chainlink-ea-accesskey"];
        const ei_ci_secret = req.headers["x-chainlink-ea-secret"];
        if(typeof ei_ci_acckey !== 'undefined' && typeof ei_ci_secret !== 'undefined') {
            if(ei_ci_acckey === process.env.EI_CI_ACCESSKEY && ei_ci_secret === process.env.I_CI_SECRET) {
                res.status(200).json({
                    status: 200,
                    message: 'Success'
                });
                return
            }
        }
    
        res.status(404).json({
            status: 404,
            message: 'Not Found'
        });
    });

    return router;
};