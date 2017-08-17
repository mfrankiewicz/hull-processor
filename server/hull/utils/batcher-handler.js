"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = batcherHandler;

var _crypto = require("crypto");

var _crypto2 = _interopRequireDefault(_crypto);

var _express = require("express");

var _responseMiddleware = require("./response-middleware");

var _responseMiddleware2 = _interopRequireDefault(_responseMiddleware);

var _requireHullMiddleware = require("./require-hull-middleware");

var _requireHullMiddleware2 = _interopRequireDefault(_requireHullMiddleware);

var _batcher = require("../infra/batcher");

var _batcher2 = _interopRequireDefault(_batcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function batcherHandler(handler) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$maxSize = _ref.maxSize,
      maxSize = _ref$maxSize === undefined ? 100 : _ref$maxSize,
      _ref$maxTime = _ref.maxTime,
      maxTime = _ref$maxTime === undefined ? 10000 : _ref$maxTime;

  var ns = _crypto2.default.randomBytes(64).toString("hex");
  var router = (0, _express.Router)();
  router.use((0, _requireHullMiddleware2.default)());
  router.post("/", function (req, res, next) {
    _batcher2.default.getHandler(ns, {
      ctx: req.hull,
      options: {
        maxSize: maxSize,
        maxTime: maxTime
      }
    }).setCallback(function (messages) {
      return handler(req.hull, messages);
    }).addMessage({ body: req.body, query: req.query }).then(next, next);
  });
  router.use((0, _responseMiddleware2.default)());

  return router;
}