"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = segmentsMiddlewareFactory;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
function segmentsMiddlewareFactory() {
  return function segmentsMiddleware(req, res, next) {
    req.hull = req.hull || {};

    if (!req.hull.client) {
      return next();
    }
    var _req$hull = req.hull,
        cache = _req$hull.cache,
        message = _req$hull.message,
        notification = _req$hull.notification,
        connectorConfig = _req$hull.connectorConfig;


    if (notification && notification.segments) {
      req.hull.segments = notification.segments;
      return next();
    }

    var bust = message && (message.Subject === "users_segment:update" || message.Subject === "users_segment:delete");

    return function () {
      if (bust) {
        return cache.del("segments");
      }
      return Promise.resolve();
    }().then(function () {
      return cache.wrap("segments", function () {
        return req.hull.client.get("/segments", {}, {
          timeout: 5000,
          retry: 1000
        });
      });
    }).then(function (segments) {
      req.hull.segments = _lodash2.default.map(segments, function (s) {
        var fieldName = connectorConfig.segmentFilterSetting;
        var fieldPath = "ship.private_settings." + fieldName;
        if (_lodash2.default.has(req.hull, fieldPath)) {
          s.filtered = _lodash2.default.includes(_lodash2.default.get(req.hull, fieldPath, []), s.id);
        }
        return s;
      });
      return next();
    }, function () {
      return next();
    });
  };
}