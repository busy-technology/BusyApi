const mongoose = require('mongoose');
const xss = require('xss-clean');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const restify = require('restify');
require('module-alias/register');

const Bugsnag = require('@bugsnag/js');
const BugsnagPluginRestify = require('@bugsnag/plugin-restify');
const logger = require('@utils/logger');
const config = require('./config');
const enrollAdmin = require('./blockchain/enrollAdmin');
const enrollOrdererAdmin = require('./blockchain/enrollOrdererAdmin');
const AdminDb = require('./blockchain/saveAdmin');
const OrdererAdminDb = require('./blockchain/saveOrdererAdmin');
const routes = require('./app/routes');
const disasterRoutes = require('./app/disasterRoutes');

const server = restify.createServer({
  name: 'Busy chaincode API',
  version: '1.0.0',
});
const cors = require('./cors');

server.pre(cors);

server.use(
  restify.plugins.throttle({
    burst: 50,
    rate: 10,
    ip: true,
    overrides: {
      '31.15.10.156': {
        rate: 0,
        burst: 0,
      },
    },
  }),
);

server.use(
  restify.plugins.bodyParser({
    mapParams: false,
    maxBodySize: 1024 * 1024 * 2,
    // requestBodyOnGet: true,
    urlencoded: { extended: false },
  }),
);

Bugsnag.start({
  apiKey: config.BUGSNAG_SECRET,
  plugins: [BugsnagPluginRestify],
});

const middleware = Bugsnag.getPlugin('restify');

server.pre(middleware.requestHandler);
// your other middleware and application routes go here
server.on('error', middleware.errorHandler);

// server.use(restify.json({ limit: '10kb' })); // body limit is 10

server.use(xss());
server.use(helmet());
server.use(mongoSanitize());

server.use(restify.plugins.queryParser({ mapParams: false }));

server.listen(config.PORT, async () => {
  mongoose.connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await enrollAdmin.FabricAdminEnroll();
  await enrollOrdererAdmin.FabricAdminEnroll();
  await AdminDb.saveAdmin();
  await OrdererAdminDb.saveOrdererAdmin();
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.log(`error in the connection ${err}`);
  const route = server.router.getRoutes();
  Object.keys(route).forEach((key) => {
    server.router.unmount(key);
  });
  disasterRoutes(server);
  console.log(`Disaster routes swithced on port ${config.PORT}`);
});

db.on('disconnected', () => {
  const route = server.router.getRoutes();
  Object.keys(route).forEach((key) => {
    server.router.unmount(key);
  });
  disasterRoutes(server);
  console.log(`Disaster routes swithced on port ${config.PORT}`);
});

db.on('open', () => {
  // deregistering any routes that exists
  const route = server.router.getRoutes();
  Object.keys(route).forEach((key) => {
    server.router.unmount(key);
  });
  routes(server);
  logger.info(`Server started on port ${config.PORT}`);
});
