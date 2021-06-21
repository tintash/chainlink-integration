import express from 'express';
import { processNewBlock } from '../initiator';
import { CoreNodeBlockMessage } from '../event-stream/core-node-message';
import { broadcastTransaction, bufferCVFromString, ChainID, contractPrincipalCV, makeContractCall } from '@stacks/transactions';
import { StacksMocknet } from '@stacks/network';
import { getOracleContract } from '../event-helpers';

export function createObserverRouter() {
    const router = express.Router();
    router.use(express.json());

    // router.post('/new_block', async (req, res) => {
    //     const core_message: CoreNodeBlockMessage = req.body;
    //     const _ = processNewBlock(ChainID.Testnet, core_message)
    //     res.sendStatus(200).end();
    // });

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

        /* temporary block of code below - to be removed later */
        if(req.originalUrl === '/new_block') {
            const core_message: CoreNodeBlockMessage = req.body;
            const _ = processNewBlock(ChainID.Testnet, core_message)
            res.sendStatus(404).end();
            return;
        }
        /* temporary block of code above - to be removed later */

        res.status(404).json({
            status: 404,
            message: 'Not Found'
        });
    });


    // For testing purposes only, to be removed
    router.get('/consumer-get-eth-price', async (req, res) => {
        const network = new StacksMocknet();
        const consumer_address = getOracleContract(ChainID.Testnet).address;
        const txOptions = {
            contractAddress: consumer_address,
            contractName: 'consumer',
            functionName: 'get-eth-price',
            functionArgs: [
                bufferCVFromString('0xde5b9eb9e7c5592930eb2e30a01369'),
                contractPrincipalCV('ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC', 'consumer'),
            ],
            senderKey: String(process.env.ORACLE_PAYMENT_KEY),
            validateWithAbi: true,
            network,
            postConditions: [],
            anchorMode: 1
        };
        try {
            const transaction = await makeContractCall(txOptions);
            const _ = broadcastTransaction(transaction, network);
            res.status(200).json({
                txid: transaction.txid(),
            });
        } catch (err) {
            res.status(400).json({ msg: err.message });
        }
    });

    return router;
};