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


export function startApiServer(): Server {
  const app = addAsync(express());
  const logger = morgan('dev');
  app.use(bodyParser.json({ type: 'application/json', limit: '500MB' }));

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(logger);

  app.use('/adapter', createAdapterRouter());
  app.use('/', createObserverRouter());

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

async function configureChainlink(): Promise<void> {
  if (String(process.env.CONFIGURE_CHAINLINK) == 'false') return;
  const cookie = await getChainlinkClientSessionCookie();
  Promise.all([createExternalInitiator(cookie), createBridge(cookie)]).then(
    ([eiName, bridgeName]) => {
      if (eiName !== '' && bridgeName !== '') {
        createJobs(cookie);
      }
    }
  );
}

async function oracleContractListner() {
  if (String(process.env.ENABLE_ORACLE_LISTENER) == 'true') {
    const socket = io(String(process.env.SOCKET_URL), {
      query: {
        subscriptions: Array.from(
          new Set([`address-transaction:${getOracleContractPrincipal(ChainID.Testnet)}`])
        ).join(','),
      },
    });
    socket.on('address-transaction', (address, data) => {
      const { tx_status, tx_type, contract_call } = data.tx;
      if (
        tx_status == 'success' &&
        tx_type == 'contract_call' &&
        contract_call.function_name == 'create-request'
      ) {
        executeChainlinkInitiatorFromObserver(data.tx.tx_id);
      }
    });
  }
}
oracleContractListner();
configureChainlink();
export const App = startApiServer();
console.log('Server initiated!');

console.log(`address-transaction:${getOracleContractPrincipal(ChainID.Testnet)}`);
