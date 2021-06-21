import express from 'express';
import path from 'path';
import http from 'http';
import { addAsync } from '@awaitjs/express';
import {createAdapterRouter} from './routes/adapter';
import {createObserverRouter} from './routes/observer';
import {normalizePort} from './helpers';
import morgan from 'morgan';
import * as bodyParser from 'body-parser';

const app = addAsync(express());
const logger = morgan('dev');
app.use(bodyParser.json({ type: 'application/json', limit: '500MB' }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(logger);

const adapterRouter = createAdapterRouter();
const observerRouter = createObserverRouter();

app.use('/cryptocompare/callback', adapterRouter);
app.use('/', observerRouter);

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
const server = http.createServer(app);
server.listen(port, '0.0.0.0');

console.log('Server initiated!');
