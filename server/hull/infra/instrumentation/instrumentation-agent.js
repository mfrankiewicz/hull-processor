"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _raven = require("raven");

var _raven2 = _interopRequireDefault(_raven);

var _datadogMetrics = require("datadog-metrics");

var _datadogMetrics2 = _interopRequireDefault(_datadogMetrics);

var _dogapi = require("dogapi");

var _dogapi2 = _interopRequireDefault(_dogapi);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _metricAgent = require("./metric-agent");

var _metricAgent2 = _interopRequireDefault(_metricAgent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var InstrumentationAgent = function () {
  function InstrumentationAgent() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, InstrumentationAgent);

    this.exitOnError = options.exitOnError || false;
    this.nr = null;
    this.raven = null;
    try {
      this.manifest = require(process.cwd() + "/manifest.json"); // eslint-disable-line import/no-dynamic-require,global-require
    } catch (e) {
      this.manifest = {};
    }

    if (process.env.NEW_RELIC_LICENSE_KEY) {
      this.nr = require("newrelic"); // eslint-disable-line global-require
    }

    if (process.env.DATADOG_API_KEY) {
      this.metrics = _datadogMetrics2.default;
      _datadogMetrics2.default.init({
        host: process.env.HOST
      });
      _dogapi2.default.initialize({ api_key: process.env.DATADOG_API_KEY });
      this.dogapi = _dogapi2.default;
    }

    if (process.env.SENTRY_URL) {
      console.log("starting raven");
      this.raven = _raven2.default.config(process.env.SENTRY_URL, {
        release: this.manifest.version,
        captureUnhandledRejections: true
      }).install(function (loggedInSentry) {
        var err = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        console.error("connector.error", { loggedInSentry: loggedInSentry, err: err.stack || err });
        if (_this.exitOnError) {
          if (process.listenerCount("gracefulExit") > 0) {
            process.emit("gracefulExit");
          } else {
            process.exit(1);
          }
        }
      });
    }

    this.contextMiddleware = this.contextMiddleware.bind(this);
  }

  _createClass(InstrumentationAgent, [{
    key: "startTransaction",
    value: function startTransaction(jobName, callback) {
      if (this.nr) {
        return this.nr.createBackgroundTransaction(jobName, callback)();
      }
      return callback();
    }
  }, {
    key: "endTransaction",
    value: function endTransaction() {
      if (this.nr) {
        this.nr.endTransaction();
      }
    }
  }, {
    key: "catchError",
    value: function catchError() {
      var err = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var extra = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var tags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (this.raven && err) {
        this.raven.captureException(err, {
          extra: extra,
          tags: tags,
          fingerprint: ["{{ default }}", err.message]
        });
      }
      return console.error("connector.error", JSON.stringify({ message: err.message, stack: err.stack, tags: tags }));
    }
  }, {
    key: "startMiddleware",
    value: function startMiddleware() {
      if (this.raven) {
        return _raven2.default.requestHandler();
      }
      return function (req, res, next) {
        next();
      };
    }
  }, {
    key: "stopMiddleware",
    value: function stopMiddleware() {
      if (this.raven) {
        return _raven2.default.errorHandler();
      }
      return function (req, res, next) {
        next();
      };
    }
  }, {
    key: "contextMiddleware",
    value: function contextMiddleware() {
      var _this2 = this;

      // eslint-disable-line class-methods-use-this
      return function (req, res, next) {
        req.hull = req.hull || {};
        req.hull.metric = req.hull.metric || new _metricAgent2.default(req.hull, _this2);
        next();
      };
    }
  }, {
    key: "ravenContextMiddleware",
    value: function ravenContextMiddleware() {
      var _this3 = this;

      return function (req, res, next) {
        var info = {
          connector: "",
          organization: ""
        };
        if (req.hull && req.hull.client) {
          var config = req.hull.client.configuration();
          info.connector = config.id;
          info.organization = config.organization;
        }
        if (_this3.raven) {
          _raven2.default.mergeContext({
            tags: {
              organization: info.organization,
              connector: info.connector
            },
            extra: {
              body: req.body,
              query: req.query,
              method: req.method,
              url: _url2.default.parse(req.url).pathname
            }
          });
        }
        next();
      };
    }
  }, {
    key: "metricVal",
    value: function metricVal(metric) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

      return new _metricAgent2.default({}, this).value(metric, value);
    }
  }]);

  return InstrumentationAgent;
}();

exports.default = InstrumentationAgent;