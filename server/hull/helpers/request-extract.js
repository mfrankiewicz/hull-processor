"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = requestExtract;

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _urijs = require("urijs");

var _urijs2 = _interopRequireDefault(_urijs);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Start an extract job and be notified with the url when complete.
 * @param  {Object} options
 * @return {Promise}
 */
function requestExtract(ctx) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$segment = _ref.segment,
      segment = _ref$segment === undefined ? null : _ref$segment,
      _ref$format = _ref.format,
      format = _ref$format === undefined ? "json" : _ref$format,
      _ref$path = _ref.path,
      path = _ref$path === undefined ? "batch" : _ref$path,
      _ref$fields = _ref.fields,
      fields = _ref$fields === undefined ? [] : _ref$fields,
      _ref$additionalQuery = _ref.additionalQuery,
      additionalQuery = _ref$additionalQuery === undefined ? {} : _ref$additionalQuery;

  var client = ctx.client,
      hostname = ctx.hostname;

  var conf = client.configuration();
  var search = _lodash2.default.merge({
    ship: conf.id,
    secret: conf.secret,
    organization: conf.organization,
    source: "connector"
  }, additionalQuery);

  if (segment) {
    search.segment_id = segment.id;
  }
  var url = (0, _urijs2.default)("https://" + hostname).path(path).search(search).toString();

  return function () {
    if (segment == null) {
      return _bluebird2.default.resolve({
        query: {}
      });
    }

    if (segment.query) {
      return _bluebird2.default.resolve(segment);
    }
    return client.get(segment.id);
  }().then(function (_ref2) {
    var query = _ref2.query;

    var params = { query: query, format: format, url: url, fields: fields };
    client.logger.debug("connector.requestExtract.params", params);
    return client.post("extract/user_reports", params);
  });
}