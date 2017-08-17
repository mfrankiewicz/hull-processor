"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = actionHandler;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _express = require("express");

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _responseMiddleware = require("./response-middleware");

var _responseMiddleware2 = _interopRequireDefault(_responseMiddleware);

var _requireHullMiddleware = require("./require-hull-middleware");

var _requireHullMiddleware2 = _interopRequireDefault(_requireHullMiddleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function actionHandler(handler) {
  var router = (0, _express.Router)();
  router.use((0, _requireHullMiddleware2.default)());
  router.post("/", function (req, res, next) {
    return _bluebird2.default.resolve(handler(req.hull, _lodash2.default.pick(req, ["body", "query"]))).then(next, next);
  });
  router.use((0, _responseMiddleware2.default)());

  return router;
}