"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _supply = require("supply");

var _supply2 = _interopRequireDefault(_supply);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Background worker using QueueAdapter.
 */
var Worker = function () {
  function Worker(_ref) {
    var Hull = _ref.Hull,
        queue = _ref.queue,
        instrumentation = _ref.instrumentation,
        cache = _ref.cache;

    _classCallCheck(this, Worker);

    if (!Hull || !queue) {
      throw new Error("Worker initialized without all required dependencies: Hull, queue");
    }
    this.queueAdapter = queue.adapter;
    this.instrumentation = instrumentation;
    this.Hull = Hull;

    this.supply = new _supply2.default();

    this.use(queue.contextMiddleware());
    this.use(cache.contextMiddleware());

    this.use(instrumentation.contextMiddleware());
    // instrument jobs between 1 and 5 minutes
    setInterval(this.metricJobs.bind(this), _lodash2.default.random(60000, 300000));

    setInterval(this.queueAdapter.clean.bind(this.queueAdapter), _lodash2.default.random(60000, 300000));
  }

  _createClass(Worker, [{
    key: "metricJobs",
    value: function metricJobs() {
      var _this = this;

      return _bluebird2.default.all([this.queueAdapter.inactiveCount(), this.queueAdapter.failedCount()]).spread(function (inactiveCount, failedCount) {
        _this.instrumentation.metricVal("ship.queue.waiting", inactiveCount);
        _this.instrumentation.metricVal("ship.queue.failed", failedCount);
      });
    }
  }, {
    key: "use",
    value: function use(middleware) {
      this.supply.use(middleware);
      return this;
    }
  }, {
    key: "setJobs",
    value: function setJobs(jobs) {
      this.jobs = jobs;
    }
  }, {
    key: "process",
    value: function process() {
      var _this2 = this;

      var queueName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "queueApp";

      this.queueAdapter.process(queueName, function (job) {
        return _this2.dispatch(job);
      });
      return this;
    }
  }, {
    key: "dispatch",
    value: function dispatch(job) {
      var _this3 = this;

      var jobName = job.data.name;
      var req = _lodash2.default.cloneDeep(job.data.context);
      var jobData = _lodash2.default.cloneDeep(job.data.payload);
      var res = {};

      var startTime = process.hrtime();
      return _bluebird2.default.fromCallback(function (callback) {
        _this3.instrumentation.startTransaction(jobName, function () {
          _this3.runMiddleware(req, res).then(function () {
            if (!_this3.jobs[jobName]) {
              var err = new Error("Job not found: " + jobName);
              req.hull.client.logger.error(err.message);
              return _bluebird2.default.reject(err);
            }
            req.hull.client.logger.debug("dispatch", { id: job.id, name: jobName });
            req.hull.metric.increment("ship.job." + jobName + ".start");
            return _this3.jobs[jobName].call(job, req.hull, jobData);
          }).then(function (jobRes) {
            callback(null, jobRes);
          }).catch(function (err) {
            req.hull.metric.increment("ship.job." + jobName + ".error");
            _this3.instrumentation.catchError(err, {
              job_id: job.id,
              job_payload: jobData
            }, {
              job_name: job.data.name,
              organization: _lodash2.default.get(job.data.context, "query.organization"),
              ship: _lodash2.default.get(job.data.context, "query.ship")
            });
            callback(err);
          }).finally(function () {
            _this3.instrumentation.endTransaction();
            var duration = process.hrtime(startTime);
            var ms = duration[0] * 1000 + duration[1] / 1000000;
            req.hull.metric.value("ship.job." + jobName + ".duration", ms);
          });
        });
      });
    }
  }, {
    key: "runMiddleware",
    value: function runMiddleware(req, res) {
      var _this4 = this;

      return _bluebird2.default.fromCallback(function (callback) {
        _this4.supply.each(req, res, callback);
      });
    }
  }]);

  return Worker;
}();

exports.default = Worker;