"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MetricAgent = function () {
  function MetricAgent(ctx, instrumentationAgent) {
    _classCallCheck(this, MetricAgent);

    this.metrics = instrumentationAgent.metrics;
    this.dogapi = instrumentationAgent.dogapi;
    this.manifest = instrumentationAgent.manifest;
    this.ctx = ctx;
  }

  _createClass(MetricAgent, [{
    key: "value",
    value: function value(metric) {
      var _value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

      if (!this.metrics) {
        return null;
      }
      try {
        return this.metrics.gauge(metric, parseFloat(_value), this.getMetricTags());
      } catch (err) {
        console.warn("metricVal.error", err);
      }
      return null;
    }
  }, {
    key: "increment",
    value: function increment(metric) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

      if (!this.metrics) {
        return null;
      }
      try {
        return this.metrics.increment(metric, parseFloat(value), this.getMetricTags());
      } catch (err) {
        console.warn("metricInc.error", err);
      }
      return null;
    }
  }, {
    key: "event",
    value: function event(_ref) {
      var title = _ref.title,
          _ref$text = _ref.text,
          text = _ref$text === undefined ? "" : _ref$text,
          _ref$properties = _ref.properties,
          properties = _ref$properties === undefined ? {} : _ref$properties;

      if (!this.dogapi) {
        return null;
      }
      return this.dogapi.event.create(this.manifest.name + "." + title, text, _lodash2.default.merge(properties, {
        tags: this.getMetricTags()
      }));
    }
  }, {
    key: "getMetricTags",
    value: function getMetricTags() {
      var _ref2 = _lodash2.default.get(this.ctx, "client") ? this.ctx.client.configuration() : {},
          _ref2$organization = _ref2.organization,
          organization = _ref2$organization === undefined ? "none" : _ref2$organization,
          _ref2$id = _ref2.id,
          id = _ref2$id === undefined ? "none" : _ref2$id;

      var hullHost = organization.split(".").slice(1).join(".");
      var tags = ["source:ship", "ship_version:" + this.manifest.version, "ship_name:" + this.manifest.name, "ship_env:" + (process.env.NODE_ENV || "production"), "hull_host:" + hullHost, "organization:" + organization, "ship:" + id];
      return tags;
    }
  }]);

  return MetricAgent;
}();

exports.default = MetricAgent;