"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = handleExtract;

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _csvStream = require("csv-stream");

var _csvStream2 = _interopRequireDefault(_csvStream);

var _JSONStream = require("JSONStream");

var _JSONStream2 = _interopRequireDefault(_JSONStream);

var _request = require("request");

var _request2 = _interopRequireDefault(_request);

var _promiseStreams = require("promise-streams");

var _promiseStreams2 = _interopRequireDefault(_promiseStreams);

var _batchStream = require("batch-stream");

var _batchStream2 = _interopRequireDefault(_batchStream);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param {Object} body Request Body Object
 * @param {Object} batchSize
 * @param {Function} callback returning a Promise
 * @return {Promise}
 *
 * return handleExtract(req, 100, (users) => Promise.resolve())
 */
function handleExtract(ctx, _ref) {
  var body = _ref.body,
      batchSize = _ref.batchSize,
      handler = _ref.handler,
      onResponse = _ref.onResponse,
      onError = _ref.onError;
  var logger = ctx.client.logger;
  var url = body.url,
      format = body.format;

  if (!url) return _bluebird2.default.reject(new Error("Missing URL"));
  var decoder = format === "csv" ? _csvStream2.default.createStream({ escapeChar: "\"", enclosedChar: "\"" }) : _JSONStream2.default.parse();

  var batch = new _batchStream2.default({ size: batchSize });

  return (0, _request2.default)({ url: url }).on("response", function (response) {
    if (_lodash2.default.isFunction(onResponse)) {
      onResponse(response);
    }
  }).on("error", function (error) {
    if (_lodash2.default.isFunction(onError)) {
      onError(error);
    }
  }).pipe(decoder).pipe(batch).pipe(_promiseStreams2.default.map({ concurrent: 2 }, function () {
    try {
      return handler.apply(undefined, arguments);
    } catch (e) {
      logger.error("ExtractAgent.handleExtract.error", e.stack || e);
      return _bluebird2.default.reject(e);
    }
  })).promise().then(function () {
    return true;
  });
}