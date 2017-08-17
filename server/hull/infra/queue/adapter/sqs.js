"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _awsSdk = require("aws-sdk");

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _sqsConsumer = require("sqs-consumer");

var _sqsConsumer2 = _interopRequireDefault(_sqsConsumer);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * SQS Adapter for queue
 */

var SQSAdapter = function () {
  _createClass(SQSAdapter, [{
    key: "inactiveCount",
    value: function inactiveCount() {
      // eslint-disable-line class-methods-use-this
      console.warn("Queue adapter inactiveCount not implemented");
      return _bluebird2.default.resolve(0);
    }
  }, {
    key: "failedCount",
    value: function failedCount() {
      // eslint-disable-line class-methods-use-this
      console.warn("Queue adapter failedCount not implemented");
      return _bluebird2.default.resolve(0);
    }
  }, {
    key: "exit",
    value: function exit() {
      // eslint-disable-line class-methods-use-this
      return this.consumer && this.consumer.stop();
    }
  }, {
    key: "setupUiRouter",
    value: function setupUiRouter(router) {
      // eslint-disable-line class-methods-use-this
      return router;
    }
  }, {
    key: "clean",
    value: function clean() {// eslint-disable-line class-methods-use-this
    }
  }]);

  function SQSAdapter(options) {
    _classCallCheck(this, SQSAdapter);

    this.options = options;
    _awsSdk2.default.config.update(_lodash2.default.pick(options, "accessKeyId", "secretAccessKey", "region"));
    this.sqs = new _awsSdk2.default.SQS({ apiVersion: "2012-11-05" });
    this.sendMessage = _bluebird2.default.promisify(this.sqs.sendMessage.bind(this.sqs));
  }

  /**
   * @param {String} jobName queue name
   * @param {Object} jobPayload
   * @return {Promise}
   */


  _createClass(SQSAdapter, [{
    key: "create",
    value: function create(jobName) {
      var jobPayload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          _ref$attempts = _ref.attempts,
          attempts = _ref$attempts === undefined ? 3 : _ref$attempts,
          _ref$delay = _ref.delay,
          delay = _ref$delay === undefined ? 0 : _ref$delay,
          _ref$priority = _ref.priority,
          priority = _ref$priority === undefined ? 1 : _ref$priority;

      return this.sendMessage({
        MessageDeduplicationId: jobName + "-" + new Date().getTime(),
        MessageGroupId: jobName + "-" + new Date().getTime(),
        DelaySeconds: delay / 1000,
        MessageAttributes: {
          jobName: { DataType: "String", StringValue: jobName },
          attempts: { DataType: "Number", StringValue: attempts.toString() },
          priority: { DataType: "Number", StringValue: priority.toString() }
        },
        MessageBody: JSON.stringify(jobPayload),
        QueueUrl: this.options.queueUrl
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
      var consumer = _sqsConsumer2.default.create({
        messageAttributeNames: [jobName],
        queueUrl: this.options.queueUrl,
        sqs: this.sqs,
        visibilityTimeout: 3600 * 4,
        terminateVisibilityTimeout: true,
        handleMessage: function handleMessage(message, done) {
          try {
            var id = message.MessageId;
            var data = JSON.parse(message.Body);
            return jobCallback({ id: id, data: data }).then(function () {
              return done();
            }).catch(done);
          } catch (err) {
            return done(err);
          }
        }
      });

      consumer.on("processing_error", function (err) {
        console.error("queue.adapter.processing_error", err);
      });

      consumer.on("error", function (err) {
        console.error("queue.adapter.error", err);
      });

      consumer.start();

      this.consumer = consumer;

      return this;
    }
  }]);

  return SQSAdapter;
}();

exports.default = SQSAdapter;