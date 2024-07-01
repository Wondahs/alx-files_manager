import express from 'express';
import injectRoutes from './routes';
import startServer from './lib/start-server';

const server = express();

injectRoutes(server);
startServer(server);

module.exports = server;
