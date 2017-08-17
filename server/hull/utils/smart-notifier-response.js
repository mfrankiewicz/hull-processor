"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FlowControl = exports.FlowControl = function () {
  function FlowControl() {
    var flowControl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, FlowControl);

    this.type = flowControl.type;
    this.size = flowControl.size;
    this.in = flowControl.in;
    this.at = flowControl.at;
  }

  _createClass(FlowControl, [{
    key: "isValid",
    value: function isValid() {
      if (!this.type) {
        return false;
      }
      if (!this.in && !this.at) {
        return false;
      }
      return true;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this;
    }
  }]);

  return FlowControl;
}();

var Metric = exports.Metric = function () {
  function Metric(metric) {
    _classCallCheck(this, Metric);

    this.name = metric.name;
  }

  _createClass(Metric, [{
    key: "toJSON",
    value: function toJSON() {
      return this;
    }
  }]);

  return Metric;
}();

var SmartNotifierResponse = function () {
  function SmartNotifierResponse() {
    _classCallCheck(this, SmartNotifierResponse);

    this.metrics = [];
  }

  _createClass(SmartNotifierResponse, [{
    key: "setFlowControl",
    value: function setFlowControl(flowControl) {
      this.flowControl = new FlowControl(flowControl);
      return this;
    }
  }, {
    key: "addMetric",
    value: function addMetric(metric) {
      this.metrics.push(new Metric(metric));
      return this;
    }
  }, {
    key: "isValid",
    value: function isValid() {
      return this.flowControl && this.flowControl.isValid();
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        flow_control: this.flowControl.toJSON(),
        metrics: this.metrics.map(function (m) {
          return m.toJSON();
        })
      };
    }
  }]);

  return SmartNotifierResponse;
}();

exports.default = SmartNotifierResponse;