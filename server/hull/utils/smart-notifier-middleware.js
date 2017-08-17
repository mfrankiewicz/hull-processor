"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = smartNotifierMiddlewareFactory;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _hullClient = require("hull-client");

var _hullClient2 = _interopRequireDefault(_hullClient);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _smartNotifierResponse = require("./smart-notifier-response");

var _smartNotifierResponse2 = _interopRequireDefault(_smartNotifierResponse);

var _smartNotifierValidator = require("./smart-notifier-validator");

var _smartNotifierValidator2 = _interopRequireDefault(_smartNotifierValidator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
function smartNotifierMiddlewareFactory(_ref) {
  var _ref$skipSignatureVal = _ref.skipSignatureValidation,
      skipSignatureValidation = _ref$skipSignatureVal === undefined ? false : _ref$skipSignatureVal;

  var smartNotifierValidator = new _smartNotifierValidator2.default();

  return function notifMiddleware(req, res, next) {
    req.hull = req.hull || {};

    if (!req || !req.body || !req.body.configuration) {
      console.log("Shit is gonna hit the fan");
      console.log(req);
      console.log("+++++++++++++++++++++++++")
    }
    smartNotifierValidator.setRequest(req);

    if (!smartNotifierValidator.hasFlagHeader()) {
      return next();
    }

    return _bodyParser2.default.json({ limit: "10mb" })(req, res, function () {
      _hullClient2.default.logger.debug("connector.smartNotifierHandler", _lodash2.default.pick(req.body, "channel", "notification_id"));

      if (!smartNotifierValidator.validatePayload()) {
        _hullClient2.default.logger.error("connector.smartNotifierHandler.error", { error: "No notification payload" });
        return res.status(400).end("Bad request");
      }

      if (!smartNotifierValidator.validateConfiguration()) {
        _hullClient2.default.logger.error("connector.smartNotifierHandler.error", { error: "No configuration object" });
        return res.status(400).end("Bad request");
      }

      return function () {
        if (skipSignatureValidation === true) {
          return _bluebird2.default.resolve();
        }
        return smartNotifierValidator.validateSignature();
      }().then(function () {
        req.hull.notification = req.body;
        req.hull.config = req.hull.notification.configuration;
        // FIXME: we need to do that mapping since the middleware is expecting
        // `ship` param instead of `id`
        req.hull.config.ship = _lodash2.default.get(req, "hull.notification.configuration.id");

        req.hull.smartNotifierResponse = new _smartNotifierResponse2.default();
        return next();
      }, function () {
        _hullClient2.default.logger.error("connector.smartNotifierHandler.error", { error: "No valid signature" });
        return res.status(400).end("Bad request");
      });
    });
  };
}
