import express from 'express';
import path from 'path';
import http from 'http';
import {createAdapterRouter} from './routes/adapter';
import {createInitiatorRouter} from './routes/initiator';
import { addAsync } from '@awaitjs/express';
import { normalizePort } from './helpers';
import morgan from 'morgan';


import * as bodyParser from 'body-parser';
const app = addAsync(express());
app.use(bodyParser.json({ type: 'application/json', limit: '500MB' }));

const logger = morgan('dev');

// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger);

const adapterRouter = createAdapterRouter();
const initiatorRouter = createInitiatorRouter();

app.use('/cryptocompare/callback', adapterRouter);
app.use('/cryptocompare', initiatorRouter);

app.use( (req,res, next) => {
    const ei_ci_acckey = req.headers["x-chainlink-ea-accesskey"];
    const ei_ci_secret = req.headers["x-chainlink-ea-secret"];

    console.log('Acces ', ei_ci_acckey);
    console.log(' Secret ', ei_ci_secret);

    console.log('Process env ', process.env.EI_CI_ACCESSKEY );
    console.log('Process env secret ', process.env.EI_CI_SECRET );

    if(typeof ei_ci_acckey !== 'undefined' && typeof ei_ci_secret !== 'undefined') {
        if(ei_ci_acckey === process.env.EI_CI_ACCESSKEY && ei_ci_secret === process.env.EI_CI_SECRET) {
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


const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
const server = http.createServer(app);
server.listen(port, '0.0.0.0');

console.log('Server initiated!');
