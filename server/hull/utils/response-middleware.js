"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = responseMiddlewareFactory;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @example
 * app.get("/", (req, res, next) => {
 *   promiseBasedFn.then(next, next);
 * }, responseMiddleware())
 */
function responseMiddlewareFactory() {
  return function responseMiddleware(result, req, res, next) {
    if (_lodash2.default.isError(result)) {
      var errorData = {
        error: result.stack || result,
        req: _lodash2.default.pick(req, "url", "method", "message")
      };
      try {
        req.hull.client.logger.error("connector.action.error", errorData);
      } catch (e) {
        console.error("action.error", errorData);
      }
      res.status(500);
    } else {
      res.status(200);
    }
    if (_lodash2.default.isError(result)) {
      result = result.message || result;
    } else {
      result = _lodash2.default.isString(result) ? result : "ok";
    }

    res.end(result);
    next();
  };
}