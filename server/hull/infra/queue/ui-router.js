"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = queueUiRouter;

var _express = require("express");

var _basicAuth = require("basic-auth");

var _basicAuth2 = _interopRequireDefault(_basicAuth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function auth(pass) {
  return function (req, res, next) {
    var user = (0, _basicAuth2.default)(req) || {};

    if (user.pass !== pass) {
      res.set("WWW-Authenticate", "Basic realm=Authorization Required");
      return res.sendStatus(401);
    }

    return next();
  };
}

function queueUiRouter(_ref) {
  var hostSecret = _ref.hostSecret,
      queueAgent = _ref.queueAgent,
      queue = _ref.queue;

  var router = (0, _express.Router)();

  router.use(auth(hostSecret));
  // @deprecated queueAgent
  (queueAgent || queue).adapter.setupUiRouter(router);

  return router;
}