"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = statusHandler;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _express = require("express");

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _requireHullMiddleware = require("./require-hull-middleware");

var _requireHullMiddleware2 = _interopRequireDefault(_requireHullMiddleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var statusMap = {
  0: "ok",
  1: "warning",
  2: "error"
};

/**
 * @param {Array} checks
 * @example
 * app.use("/status", statusHandler([
 * (ctx) => {
 *   return Promise.resolve({
 *     status: "ok|error|warning",
 *     message: "Error Message"
 *   });
 * }
 * ]));
 */
function statusHandler(checks) {
  var router = (0, _express.Router)();
  router.use((0, _requireHullMiddleware2.default)());
  router.post("/", function (req, res) {
    var messages = [];
    var globalStatus = 0;

    var promises = _bluebird2.default.mapSeries(checks, function (check) {
      check(req.hull).then(function (_ref) {
        var status = _ref.status,
            message = _ref.message;

        messages.push(message);
        var statusNumeric = _lodash2.default.flip(statusMap)[status] || 2;
        globalStatus = Math.min(globalStatus, statusNumeric);
      });
    });

    promises.then(function () {
      res.json({
        messages: messages,
        status: statusMap[globalStatus] || "error"
      });
    }, function () {
      res.status(500).json({
        status: "error"
      });
    });
  });

  return router;
}