"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _kue = require("kue");

var _kue2 = _interopRequireDefault(_kue);

var _kueUi = require("kue-ui");

var _kueUi2 = _interopRequireDefault(_kueUi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Kue Adapter for queue
 */
var KueAdapter = function () {

  /**
   * @param {Object} queue Kue instance
   */
  function KueAdapter(options) {
    var _this = this;

    _classCallCheck(this, KueAdapter);

    this.options = options;
    this.queue = _kue2.default.createQueue(options);
    this.queue.watchStuckJobs();
    this.queue.on("error", function (err) {
      console.error("queue.adapter.error", err);
    });
    this.app = _kue2.default.app;

    ["inactiveCount", "activeCount", "completeCount", "failedCount", "delayedCount"].forEach(function (name) {
      _this[name] = _bluebird2.default.promisify(_this.queue[name]).bind(_this.queue);
    });
  }

  /**
   * @param {String} jobName queue name
   * @param {Object} jobPayload
   * @return {Promise}
   */


  _createClass(KueAdapter, [{
    key: "create",
    value: function create(jobName) {
      var _this2 = this;

      var jobPayload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          _ref$ttl = _ref.ttl,
          ttl = _ref$ttl === undefined ? 0 : _ref$ttl,
          _ref$delay = _ref.delay,
          delay = _ref$delay === undefined ? null : _ref$delay,
          _ref$priority = _ref.priority,
          priority = _ref$priority === undefined ? null : _ref$priority;

      return _bluebird2.default.fromCallback(function (callback) {
        var job = _this2.queue.create(jobName, jobPayload).attempts(3).removeOnComplete(true);

        if (ttl) {
          job.ttl(ttl);
        }

        if (delay) {
          job.delay(delay);
        }

        if (priority) {
          job.priority(priority);
        }

        return job.save(function (err) {
          callback(err, job.id);
        });
      });
    }

    /**
     * @param {String} jobName
     * @param {Function -> Promise} jobCallback
     * @return {Object} this
     */

  }, {
    key: "process",
    value: function process(jobName, jobCallback) {
      this.queue.process(jobName, function (job, done) {
        jobCallback(job).then(function (res) {
          done(null, res);
        }, function (err) {
          done(err);
        }).catch(function (err) {
          done(err);
        });
      });
      return this;
    }
  }, {
    key: "exit",
    value: function exit() {
      var _this3 = this;

      return _bluebird2.default.fromCallback(function (callback) {
        _this3.queue.shutdown(5000, callback);
      });
    }
  }, {
    key: "setupUiRouter",
    value: function setupUiRouter(router) {
      _kueUi2.default.setup({
        apiURL: "/kue/_api", // IMPORTANT: specify the api url
        baseURL: "/kue", // IMPORTANT: specify the base url
        updateInterval: 5000 // Optional: Fetches new data every 5000 ms
      });

      router.use("/_api", this.app);
      router.use("/", _kueUi2.default.app);
      return router;
    }
  }, {
    key: "clean",
    value: function clean() {} // eslint-disable-line class-methods-use-this

  }]);

  return KueAdapter;
}();

exports.default = KueAdapter;