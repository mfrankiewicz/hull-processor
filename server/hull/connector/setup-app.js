"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = setupApp;

var _ejs = require("ejs");

var _connectTimeout = require("connect-timeout");

var _connectTimeout2 = _interopRequireDefault(_connectTimeout);

var _utils = require("../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Base Express app for Ships front part
 */
function setupApp(_ref) {
  var instrumentation = _ref.instrumentation,
      queue = _ref.queue,
      cache = _ref.cache,
      app = _ref.app,
      connectorConfig = _ref.connectorConfig;

  app.use((0, _utils.tokenMiddleware)());
  app.use((0, _utils.notifMiddleware)());
  app.use((0, _utils.smartNotifierMiddleware)({ skipSignatureValidation: connectorConfig.skipSignatureValidation }));
  app.use(instrumentation.startMiddleware());

  app.use(instrumentation.contextMiddleware());
  app.use(queue.contextMiddleware());
  app.use(cache.contextMiddleware());

  // the main responsibility of following timeout middleware
  // is to make the web app respond always in time
  app.use((0, _connectTimeout2.default)("25s"));
  app.engine("html", _ejs.renderFile);

  app.set("views", process.cwd() + "/views");
  app.set("view engine", "ejs");

  app.use("/", (0, _utils.staticRouter)());

  return app;
}