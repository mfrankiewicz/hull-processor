"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bull = require("bull");

var _bull2 = _interopRequireDefault(_bull);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Bull Adapter for queue
 */
var BullAdapter = function () {
  function BullAdapter(options) {
    _classCallCheck(this, BullAdapter);

    this.options = options;
    this.queue = new _bull2.default("main", options);
    this.queue.on("error", function (err) {
      console.error("queue.adapter.error", err);
    });
    this.queue.on("cleaned", function (job, type) {
      console.log("queue.adapter.clean", { count: job.length, type: type });
    });
  }

  _createClass(BullAdapter, [{
    key: "inactiveCount",
    value: function inactiveCount() {
      return this.queue.getJobCounts().then(function (counts) {
        return counts.wait;
      });
    }
  }, {
    key: "failedCount",
    value: function failedCount() {
      return this.queue.getJobCounts().then(function (counts) {
        return counts.failed;
      });
    }

    /**
     * @param {String} jobName queue name
     * @param {Object} jobPayload
     * @return {Promise}
     */

  }, {
    key: "create",
    value: function create(jobName) {
      var jobPayload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          _ref$ttl = _ref.ttl,
          ttl = _ref$ttl === undefined ? 0 : _ref$ttl,
          _ref$delay = _ref.delay,
          delay = _ref$delay === undefined ? null : _ref$delay,
          _ref$priority = _ref.priority,
          priority = _ref$priority === undefined ? null : _ref$priority;

      var options = {
        priority: priority,
        delay: delay,
        timeout: ttl,
        attempts: 3,
        removeOnComplete: true
      };
      return this.queue.add(jobName, jobPayload, options);
    }

    /**
     * @param {String} jobName
     * @param {Function -> Promise} jobCallback
     * @return {Object} this
     */

  }, {
    key: "process",
    value: function process(jobName, jobCallback) {
      this.queue.process(jobName, function (job) {
        return jobCallback(job);
      });
      return this;
    }
  }, {
    key: "exit",
    value: function exit() {
      return this.queue.close();
    }
  }, {
    key: "setupUiRouter",
    value: function setupUiRouter(router) {
      // eslint-disable-line class-methods-use-this
      // due to problems in arena configuration it's disabled right now
      // and removed from the package.json
      //
      // const arenaConfig = {
      //   queues: [{
      //     name: "main",
      //     port: this.queue.client.options.port,
      //     host: this.queue.client.options.host,
      //     hostId: "main",
      //     db: this.queue.client.options.db,
      //     password: this.queue.client.options.password,
      //     prefix: this.options.prefix
      //   }]
      // };
      // router.use('/', arena(arenaConfig));
      return router;
    }
  }, {
    key: "clean",
    value: function clean() {
      // failed in more than 15 days
      this.queue.clean(1296000000, "failed");
    }
  }]);

  return BullAdapter;
}();

exports.default = BullAdapter;