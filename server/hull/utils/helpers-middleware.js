"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = helpersMiddlewareFactory;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _helpers = require("../helpers");

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function helpersMiddlewareFactory() {
  return function helpersMiddleware(req, res, next) {
    req.hull = req.hull || {};
    req.hull.helpers = _lodash2.default.mapValues(helpers, function (func) {
      return func.bind(null, req.hull);
    });
    next();
  };
}