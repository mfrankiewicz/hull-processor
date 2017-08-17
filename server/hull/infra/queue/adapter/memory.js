"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MemoryAdapter = function () {

  /**
   * @param {Object} queue Kue instance
   */
  function MemoryAdapter() {
    var _this = this;

    _classCallCheck(this, MemoryAdapter);

    this.queue = {};
    this.processors = {};
    ["inactiveCount", "activeCount", "completeCount", "failedCount", "delayedCount"].forEach(function (name) {
      _this[name] = function () {
        return _bluebird2.default.resolve(0);
      };
    });
  }

  /**
   * @param {String} jobName queue name
   * @param {Object} jobPayload
   * @return {Promise}
   */


  _createClass(MemoryAdapter, [{
    key: "create",
    value: function create(jobName) {
      var jobPayload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          _ref$delay = _ref.delay,
          delay = _ref$delay === undefined ? null : _ref$delay;

      if (delay) {
        setTimeout(this.enqueue.bind(this, jobName, jobPayload), delay);
        return _bluebird2.default.resolve();
      }

      return this.enqueue(jobName, jobPayload);
    }
  }, {
    key: "enqueue",
    value: function enqueue(jobName, jobPayload) {
      this.queue[jobName] = this.queue[jobName] || [];
      this.queue[jobName].push({
        id: this.queue[jobName].length,
        data: _extends({
          name: jobName
        }, jobPayload)
      });
      return this.processQueues();
    }

    /**
     * @param {String} jobName
     * @param {Function -> Promise} jobCallback
     * @return {Object} this
     */

  }, {
    key: "process",
    value: function process(jobName, jobCallback) {
      this.processors[jobName] = jobCallback;
      this.processQueues();
      return this;
    }
  }, {
    key: "processQueues",
    value: function processQueues() {
      var _this2 = this;

      return _bluebird2.default.all(_lodash2.default.map(this.processors, function (jobCallback, jobName) {
        if (_lodash2.default.get(_this2.queue, jobName, []).length === 0) {
          return _bluebird2.default.resolve();
        }
        var job = _this2.queue[jobName].pop();
        return jobCallback(job);
      }));
      // .then(() => {
      //   this.processQueues();
      // }, () => {
      //   this.processQueues();
      // });
    }
  }, {
    key: "exit",
    value: function exit() {
      return _bluebird2.default.resolve(this);
    }
  }, {
    key: "clean",
    value: function clean() {} // eslint-disable-line class-methods-use-this

  }]);

  return MemoryAdapter;
}();

exports.default = MemoryAdapter;