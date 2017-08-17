"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = tokenMiddlewareFactory;
/**
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
function tokenMiddlewareFactory() {
  return function tokenMiddleware(req, res, next) {
    if (req.query && (req.query.hullToken || req.query.token || req.query.state)) {
      req.hull = req.hull || {};
      req.hull.token = req.query.hullToken || req.query.token || req.query.state;
    }
    next();
  };
}