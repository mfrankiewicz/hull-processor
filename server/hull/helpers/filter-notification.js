"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = filterNotification;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns information if provided notification should be sent in an outgoing sync.
 * By default it uses a setting called `synchronized_segments`. If the user belongs
 * to one of set segments the notification will be passed through.
 *
 * If the field doesn't exists it will pass all notifications, if the setting exists but it's empty
 * it will send noone.
 *
 * @param  {Object} ctx The Context Object
 * @param  {Object} notification Hull user:update notification
 * @param  {String} fieldName the name of settings name
 * @return {Boolean}
 */
function filterNotification(ctx, notification, fieldName) {
  fieldName = fieldName || _lodash2.default.get(ctx, "connectorConfig.segmentFilterSetting");
  if (!_lodash2.default.has(ctx.ship.private_settings, fieldName)) {
    return true;
  }
  var filterSegmentIds = _lodash2.default.get(ctx.ship.private_settings, fieldName, []);

  var segments = _lodash2.default.get(notification, "segments", []);
  return _lodash2.default.intersection(filterSegmentIds, segments.map(function (s) {
    return s.id;
  })).length > 0;
}