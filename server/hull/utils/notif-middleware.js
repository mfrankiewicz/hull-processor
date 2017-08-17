"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = notifMiddlewareFactory;

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _snsValidator = require("sns-validator");

var _snsValidator2 = _interopRequireDefault(_snsValidator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
function notifMiddlewareFactory() {
  var validator = new _snsValidator2.default(/sns\.us-east-1\.amazonaws\.com/, "utf8");

  function verify(req, res, next) {
    if (!req.hull.message) {
      return next();
    }

    return validator.validate(req.hull.message, function validate(err) {
      if (err) {
        console.warn("Invalid signature error", req.hull.message);
      }

      var message = req.hull.message;


      if (message.Type === "SubscriptionConfirmation") {
        return next();
      } else if (message.Type === "Notification") {
        try {
          var payload = JSON.parse(message.Message);
          req.hull.notification = {
            subject: message.Subject,
            message: payload,
            timestamp: new Date(message.Timestamp)
          };
          return next();
        } catch (error) {
          var e = new Error("Invalid Message");
          e.status = 400;
          return next(e);
        }
      }
      return next();
    });
  }

  return function notifMiddleware(req, res, next) {
    req.hull = req.hull || {};
    if (req.headers["x-amz-sns-message-type"] || req.url.match("/batch")) {
      req.headers["content-type"] = "application/json;charset=UTF-8";
      _bodyParser2.default.json({ limit: "256kb" })(req, res, function () {
        if (req.body && req.body.Message && req.body.Type) {
          req.hull.message = req.body;
        }
        verify(req, res, next);
      });
    } else {
      next();
    }
  };
}