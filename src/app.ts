import express from 'express';
import path from 'path';
import http, { Server } from 'http';
import { Socket } from 'net';
import { addAsync } from '@awaitjs/express';
import { createAdapterRouter } from './routes/adapter';
import { createObserverRouter } from './routes/observer';
import morgan from 'morgan';
import * as bodyParser from 'body-parser';
import { createExternalInitiator, createBridge, createJobs } from './configure-chainlink';
import { getChainlinkClientSessionCookie } from './initiator-helpers';

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

configureChainlink();
export const App = startApiServer();
console.log('Server initiated!');
