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
import { ChainlinkNodeConfig, ServerConfig } from './helpers';

const serverConfig: ServerConfig = {
  stacksApiUrl: String(process.env.STACKS_CORE_API_URL),
  chainlinkHost: String(process.env.CHAINLINK_HOST),
  chainlinkPort: String(process.env.CHAINLINK_PORT),
  enableOracleListner: process.env.ENABLE_ORACLE_LISTENER
    ? process.env.ENABLE_ORACLE_LISTENER
    : 'false',
};

const chainlinkConfig: ChainlinkNodeConfig = {
  eiName: String(process.env.CHAINLINK_EI_NAME),
  eiUrl: String(process.env.CHAINLINK_EI_URL),
  bridgeName: String(process.env.CHAINLINK_BRIDGE_NAME),
  bridgeUrl: String(process.env.CHAINLINK_BRIDGE_URL),
  chainlinkHost: String(process.env.CHAINLINK_HOST),
  chainlinkPort: String(process.env.CHAINLINK_PORT),
  configureChainlink: String(process.env.CONFIGURE_CHAINLINK),
  createSampleJobs: String(process.env.CREATE_SAMPLE_JOBS),
};

export function startApiServer(serverConfig: ServerConfig): Server {
  const app = addAsync(express());
  const logger = morgan('dev');
  app.use(bodyParser.json({ type: 'application/json', limit: '500MB' }));

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(logger);

  app.use('/adapter', createAdapterRouter(serverConfig.stacksApiUrl));
  app.use('/', createObserverRouter(serverConfig));

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

async function configureChainlink(chainlinkConfig: ChainlinkNodeConfig): Promise<void> {
  const { configureChainlink, chainlinkHost, chainlinkPort } = chainlinkConfig;
  if (configureChainlink === 'false') {
    return;
  }
  const cookie = await getChainlinkClientSessionCookie(chainlinkHost, chainlinkPort);
  Promise.all([
    createExternalInitiator(cookie, chainlinkConfig),
    createBridge(cookie, chainlinkConfig),
  ]).then(([eiName, bridgeName]) => {
    if (eiName !== '' && bridgeName !== '') {
      createJobs(cookie, chainlinkConfig);
    }
  });
}

async function oracleContractListner(serverConfig: ServerConfig) {
  const { enableOracleListner, stacksApiUrl, chainlinkHost, chainlinkPort } = serverConfig;
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
        executeChainlinkInitiatorFromObserver(
          data.tx.tx_id,
          stacksApiUrl,
          chainlinkHost,
          chainlinkPort
        );
      }
    });
  }
}

configureChainlink(chainlinkConfig);
oracleContractListner(serverConfig);
export const App = startApiServer(serverConfig);
console.log('Server initiated!');
