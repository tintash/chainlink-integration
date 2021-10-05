import express from 'express';
import path from 'path';
import http, { Server } from 'http';
import { Socket } from 'net';
import { addAsync } from '@awaitjs/express';
import { createAdapterRouter } from './routes/adapter';
import { createObserverRouter } from './routes/observer';
import morgan from 'morgan';
import { ChainID } from '@stacks/transactions';
import * as bodyParser from 'body-parser';
import { createExternalInitiator, createBridge, createJobs } from './configure-chainlink';
import { getChainlinkClientSessionCookie } from './initiator-helpers';
import { executeChainlinkInitiatorFromObserver, getOracleContractPrincipal } from './event-helpers';
import { io } from 'socket.io-client';

const STACKS_API_URL = String(process.env.STACKS_CORE_API_URL);
const CHAINLINK_HOST = String(process.env.CHAINLINK_HOST);
const ENABLE_ORACLE_LISTENER = String(process.env.ENABLE_ORACLE_LISTENER);
const CHAINLINK_EI_NAME = String(process.env.CHAINLINK_EI_NAME);
const CHAINLINK_EI_URL = String(process.env.CHAINLINK_EI_URL);
const CHAINLINK_BRIDGE_NAME = String(process.env.CHAINLINK_BRIDGE_NAME);
const CHAINLINK_BRIDGE_URL = String(process.env.CHAINLINK_BRIDGE_URL);
const CONFIGURE_CHAINLINK = String(process.env.CONFIGURE_CHAINLINK);
const CREATE_SAMPLE_JOBS = String(process.env.CREATE_SAMPLE_JOBS);

export function startApiServer(
  stacksApiUrl: string,
  chainlinkHost: string,
  enableOracleListner: string
): Server {
  const app = addAsync(express());
  const logger = morgan('dev');
  app.use(bodyParser.json({ type: 'application/json', limit: '500MB' }));

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(logger);

  app.use('/adapter', createAdapterRouter(stacksApiUrl));
  app.use('/', createObserverRouter(enableOracleListner, stacksApiUrl, chainlinkHost));

  const port = parseInt(String(process.env.PORT)) || 3501;
  app.set('port', port);
  const server = http.createServer(app);
  server.listen(port, '0.0.0.0');
  const serverSockets = new Set<Socket>();
  server.on('connection', socket => {
    serverSockets.add(socket);
    socket.on('close', () => {
      serverSockets.delete(socket);
    });
  });

  return server;
}

async function configureChainlink(
  eiName: string,
  eiUrl: string,
  bridgeName: string,
  bridgeUrl: string,
  chainlinkHost: string,
  configureChainlink: string,
  createSampleJobs: string
): Promise<void> {
  if (configureChainlink === 'false') {
    return;
  }
  const cookie = await getChainlinkClientSessionCookie(chainlinkHost);
  Promise.all([
    createExternalInitiator(eiName, eiUrl, cookie, chainlinkHost),
    createBridge(bridgeName, bridgeUrl, cookie, chainlinkHost),
  ]).then(([eiName, bridgeName]) => {
    if (eiName !== '' && bridgeName !== '') {
      createJobs(cookie, chainlinkHost, createSampleJobs);
    }
  });
}

async function oracleContractListner(
  stacksApiUrl: string,
  chainlinkHost: string,
  enableOracleListner: string
) {
  if (enableOracleListner === 'true') {
    var socket = io(stacksApiUrl, {
      query: {
        subscriptions: Array.from(
          new Set([`address-transaction:${getOracleContractPrincipal(ChainID.Testnet)}`])
        ).join(','),
      },
    });
    socket.on('address-transaction', (_, data) => {
      const { tx_status, tx_type, contract_call } = data.tx;
      if (
        tx_status == 'success' &&
        tx_type == 'contract_call' &&
        contract_call.function_name == 'create-request'
      ) {
        executeChainlinkInitiatorFromObserver(data.tx.tx_id, stacksApiUrl, chainlinkHost);
      }
    });
  }
}

configureChainlink(
  CHAINLINK_EI_NAME,
  CHAINLINK_EI_URL,
  CHAINLINK_BRIDGE_NAME,
  CHAINLINK_BRIDGE_URL,
  CHAINLINK_HOST,
  CONFIGURE_CHAINLINK,
  CREATE_SAMPLE_JOBS
);
oracleContractListner(STACKS_API_URL, CHAINLINK_HOST, ENABLE_ORACLE_LISTENER);
export const App = startApiServer(STACKS_API_URL, CHAINLINK_HOST, ENABLE_ORACLE_LISTENER);
console.log('Server initiated!');
