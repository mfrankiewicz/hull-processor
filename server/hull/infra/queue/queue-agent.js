"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _enqueue = require("./enqueue");

var _enqueue2 = _interopRequireDefault(_enqueue);

var _memory = require("./adapter/memory");

var _memory2 = _interopRequireDefault(_memory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QueueAgent = function () {
  function QueueAgent(adapter) {
    _classCallCheck(this, QueueAgent);

    this.adapter = adapter;
    if (!this.adapter) {
      this.adapter = new _memory2.default();
    }

    this.contextMiddleware = this.contextMiddleware.bind(this);
  }

  _createClass(QueueAgent, [{
    key: "contextMiddleware",
    value: function contextMiddleware() {
      var _this = this;

      // eslint-disable-line class-methods-use-this
      return function (req, res, next) {
        req.hull = req.hull || {};
        req.hull.enqueue = req.hull.enqueue || _enqueue2.default.bind(null, _this.adapter, req.hull);
        return next();
      };
    }
  }, {
    key: "exit",
    value: function exit() {
      return this.adapter.exit();
    }
  }]);

  return QueueAgent;
}();

exports.default = QueueAgent;