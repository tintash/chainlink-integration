import express from 'express';
import { processNewBlock } from '../initiator';
import { CoreNodeBlockMessage } from '../event-stream/core-node-message';
import { createSTXPostCondition, broadcastTransaction, bufferCVFromString, ChainID, contractPrincipalCV, makeContractCall, FungibleConditionCode } from '@stacks/transactions';
import { StacksMocknet } from '@stacks/network';
import { getOracleContract } from '../event-helpers';
import BigNum from 'bn.js';
import { bufferToHexPrefixString, hexToBuffer, hexToDirectRequestParams, paramsToHexPrefixString } from '../helpers';

export function createObserverRouter() {
    const router = express.Router();
    router.use(express.json());

    router.post('/new_block', async (req, res) => {
        const core_message: CoreNodeBlockMessage = req.body;
        const _ = processNewBlock(ChainID.Testnet, core_message)
        res.sendStatus(200).end();
    });

    router.post('/new_burn_block', async (req, res) => {
        res.sendStatus(200);
    });

    router.post('/new_mempool_tx', async (req, res) => {
        res.sendStatus(200);
    });

    router.post('/drop_mempool_tx', async (req, res) => {
        res.sendStatus(200);
    });

    // For testing purposes only, to be removed
    router.get('/consumer-test', async (req, res) => {
        const network = new StacksMocknet();
        const consumer_address = getOracleContract(ChainID.Testnet).address;
        const post_condition = createSTXPostCondition('ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC', FungibleConditionCode.Equal, new BigNum(300));
        const txOptions = {
            contractAddress: consumer_address,
            contractName: 'direct-request',
            functionName: 'request-api',
            functionArgs: [
                bufferCVFromString('0x3334346664393436386561363437623838633530336461633830383263306134'),
                bufferCVFromString("0x7b22676574223a2268747470733a2f2f6d696e2d6170692e63727970746f636f6d706172652e636f6d2f646174612f70726963653f6673796d3d455448267473796d733d555344222c2270617468223a22555344227d"),
                contractPrincipalCV('ST248M2G9DF9G5CX42C31DG04B3H47VJK6W73JDNC', 'direct-request'),
            ],
            senderKey: String(process.env.TEST_ACC_PAYMENT_KEY),
            validateWithAbi: true,
            network,
            postConditions: [post_condition],
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

    router.post('/create-buff', async (req, res) => {
        var elements: {[name: string]: string} = {};
        Object.keys(req.body).map((key,_) => {
            const value = req.body[key].toString();
            if(value && value!=='undefined') elements[key] = value;
        })
        
        if(Object.keys(elements).length===0) res.status(400).json({ msg: 'bad request body'});

        try {
            const result = await paramsToHexPrefixString(elements);
            res.status(200).json(result);
        } catch (err) {
            res.status(400).json(err.message);
        }
    });

    router.post('/decode-buff', async (req, res) => {
        const buf_string = req.body.buffer;
        if( buf_string === 'undefined' ||  typeof buf_string != 'string') res.status(400).json({ msg: 'bad request body'});
        try {
            const result = await hexToDirectRequestParams(buf_string);
            res.status(200).json(result);
        } catch (err) {
            res.status(400).json(err.message);
        }
    });

    router.post('/key-to-buff', async (req, res) => {
        const key = req.body.key;
        if( key === 'undefined' ||  typeof key != 'string') res.status(400).json({ msg: 'bad request body'});
        try {
            const result = await bufferToHexPrefixString(Buffer.from(key));
            res.status(200).json({
                key: key,
                buffer: result
            });
        } catch (err) {
            res.status(400).json(err.message);
        }
    });

    router.use((req,res, next) => {
        const ei_ci_acckey = req.headers["x-chainlink-ea-accesskey"];
        const ei_ci_secret = req.headers["x-chainlink-ea-secret"];
        if(typeof ei_ci_acckey !== 'undefined' && typeof ei_ci_secret !== 'undefined') {
            if(ei_ci_acckey === String(process.env.EI_CI_ACCESSKEY) && ei_ci_secret === String(process.env.EI_CI_SECRET)) {
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