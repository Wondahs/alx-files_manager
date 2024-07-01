import AppController from '../controllers/AppController';

function injectRoutes(server) {
  server.get('/status', AppController.getStatus);
  server.get('/stats', AppController.getStats);
}

module.exports = injectRoutes;
