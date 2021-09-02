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

  const adapterRouter = createAdapterRouter();
  const observerRouter = createObserverRouter();

  app.use('/adapter', adapterRouter);
  app.use('/', observerRouter);

  const port = parseInt(String(process.env.PORT)) || 3000;
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
  const cookie = await getChainlinkClientSessionCookie();
  const ok0 = await createExternalInitiator(cookie);
  const ok1 = await createBridge(cookie);
  if (ok0 && ok1) {
    createJobs(cookie);
  }
}

configureChainlink();
export const App = startApiServer();
console.log('Server initiated!');
