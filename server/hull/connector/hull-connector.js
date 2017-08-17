"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _setupApp2 = require("./setup-app");

var _setupApp3 = _interopRequireDefault(_setupApp2);

var _worker = require("./worker");

var _worker2 = _interopRequireDefault(_worker);

var _infra = require("../infra");

var _utils = require("../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HullConnector = function () {
  function HullConnector(Hull) {
    var _this = this;

    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        hostSecret = _ref.hostSecret,
        port = _ref.port,
        _ref$clientConfig = _ref.clientConfig,
        clientConfig = _ref$clientConfig === undefined ? {} : _ref$clientConfig,
        instrumentation = _ref.instrumentation,
        cache = _ref.cache,
        queue = _ref.queue,
        connectorName = _ref.connectorName,
        segmentFilterSetting = _ref.segmentFilterSetting,
        skipSignatureValidation = _ref.skipSignatureValidation;

    _classCallCheck(this, HullConnector);

    this.Hull = Hull;
    this.instrumentation = instrumentation || new _infra.Instrumentation();
    this.cache = cache || new _infra.Cache();
    this.queue = queue || new _infra.Queue();
    this.port = port;
    this.hostSecret = hostSecret;
    this.clientConfig = clientConfig;
    this.connectorConfig = {};
    this.middlewares = [];

    if (connectorName) {
      this.clientConfig.connectorName = connectorName;
    } else {
      try {
        var manifest = JSON.parse(_fs2.default.readFileSync(process.cwd() + "/manifest.json"));
        if (manifest.name) {
          this.clientConfig.connectorName = _lodash2.default.kebabCase(manifest.name);
        }
      } catch (error) {} // eslint-disable-line no-empty
    }

    if (segmentFilterSetting) {
      this.connectorConfig.segmentFilterSetting = segmentFilterSetting;
    }

    if (skipSignatureValidation) {
      this.connectorConfig.skipSignatureValidation = skipSignatureValidation;
    }

    (0, _utils.exitHandler)(function () {
      return _bluebird2.default.all([_infra.Batcher.exit(), _this.queue.exit()]);
    });
  }

  _createClass(HullConnector, [{
    key: "setupApp",
    value: function setupApp(app) {
      var _this2 = this;

      (0, _setupApp3.default)({
        app: app,
        instrumentation: this.instrumentation,
        cache: this.cache,
        queue: this.queue,
        connectorConfig: this.connectorConfig
      });
      app.use(function (req, res, next) {
        req.hull = req.hull || {};
        req.hull.connectorConfig = _this2.connectorConfig;
        next();
      });
      app.use(this.clientMiddleware());
      app.use(this.instrumentation.ravenContextMiddleware());
      app.use((0, _utils.helpersMiddleware)());
      app.use((0, _utils.segmentsMiddleware)());
      this.middlewares.map(function (middleware) {
        return app.use(middleware);
      });

      return app;
    }
  }, {
    key: "startApp",
    value: function startApp(app) {
      var _this3 = this;

      app.use(this.instrumentation.stopMiddleware());
      return app.listen(this.port, function () {
        _this3.Hull.logger.info("connector.server.listen", { port: _this3.port });
      });
    }
  }, {
    key: "worker",
    value: function worker(jobs) {
      var _this4 = this;

      this._worker = this._worker || new _worker2.default({
        Hull: this.Hull,
        instrumentation: this.instrumentation,
        cache: this.cache,
        queue: this.queue
      });
      this._worker.use(function (req, res, next) {
        req.hull = req.hull || {};
        req.hull.connectorConfig = _this4.connectorConfig;
        next();
      });
      this._worker.use(this.clientMiddleware());
      this._worker.use((0, _utils.requireHullMiddleware)());
      this._worker.use((0, _utils.helpersMiddleware)());
      this._worker.use((0, _utils.segmentsMiddleware)());
      this.middlewares.map(function (middleware) {
        return _this4._worker.use(middleware);
      });

      this._worker.setJobs(jobs);
      return this._worker;
    }
  }, {
    key: "use",
    value: function use(middleware) {
      this.middlewares.push(middleware);
      return this;
    }
  }, {
    key: "clientMiddleware",
    value: function clientMiddleware() {
      this._middleware = this._middleware || this.Hull.Middleware({
        hostSecret: this.hostSecret,
        clientConfig: this.clientConfig
      });
      return this._middleware;
    }
  }, {
    key: "startWorker",
    value: function startWorker() {
      var queueName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "queueApp";

      this.instrumentation.exitOnError = true;
      if (this._worker) {
        this._worker.process(queueName);
        this.Hull.logger.info("connector.worker.process", { queueName: queueName });
      }
    }
  }]);

  return HullConnector;
}();

exports.default = HullConnector;