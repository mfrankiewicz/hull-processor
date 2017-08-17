"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HANDLERS = {};

var Batcher = function () {
  _createClass(Batcher, null, [{
    key: "exit",
    value: function exit() {
      console.log("batcher.exit");
      if (!Batcher.exiting) {
        var exiting = _bluebird2.default.all(_lodash2.default.map(HANDLERS, function (h) {
          return h.flush();
        }));
        Batcher.exiting = exiting;
        return exiting;
      }
      return _bluebird2.default.resolve([]);
    }
  }, {
    key: "getHandler",
    value: function getHandler(ns, args) {
      var name = ns + args.ctx.ship.id;
      return HANDLERS[name] = HANDLERS[name] || new Batcher(ns, args); // eslint-disable-line no-return-assign
    }
  }]);

  function Batcher(ns, _ref) {
    var ctx = _ref.ctx,
        _ref$options = _ref.options,
        options = _ref$options === undefined ? {} : _ref$options;

    _classCallCheck(this, Batcher);

    this.ns = ns;
    this.logger = ctx.client.logger;
    this.messages = [];
    this.options = options;

    this.flushLater = _lodash2.default.throttle(this.flush.bind(this), this.options.maxTime);
    return this;
  }

  _createClass(Batcher, [{
    key: "setCallback",
    value: function setCallback(callback) {
      this.callback = callback;
      return this;
    }
  }, {
    key: "addMessage",
    value: function addMessage(message) {
      this.messages.push(message);
      this.logger.debug("batcher.added", this.messages.length);
      var maxSize = this.options.maxSize;

      if (this.messages.length >= maxSize) {
        this.flush();
      } else {
        this.flushLater();
      }
      return _bluebird2.default.resolve("ok");
    }
  }, {
    key: "flush",
    value: function flush() {
      var _this = this;

      var messages = this.messages;
      this.logger.debug("batcher.flush", messages.length);
      this.messages = [];
      return _bluebird2.default.resolve(this.callback(messages)).then(function () {
        _this.logger.debug("batcher.flush.sucess", true);
      }, function (err) {
        console.error(err);
        _this.logger.error("batcher.flush.error", err);
      });
    }
  }]);

  return Batcher;
}();

exports.default = Batcher;