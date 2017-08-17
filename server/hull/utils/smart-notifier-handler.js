"use strict";

var _hullClient = require("hull-client");

var _hullClient2 = _interopRequireDefault(_hullClient);

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _requireHullMiddleware = require("./require-hull-middleware");

var _requireHullMiddleware2 = _interopRequireDefault(_requireHullMiddleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultSuccessFlowControl = {
  type: "next",
  size: 1,
  in: 1000
};

var defaultErrorFlowControl = {
  type: "retry",
  in: 1000
};

function processHandlersFactory(handlers, userHandlerOptions) {
  return function process(req, res, next) {
    try {
      var _req$hull = req.hull,
          notification = _req$hull.notification,
          client = _req$hull.client;

      if (!notification || !notification.notification_id) {
        return next();
      }
      client.logger.debug("connector.smartNotifierHandler.process", {
        notification_id: notification.notification_id,
        channel: notification.channel,
        messages_count: notification.messages.length
      });
      var eventName = notification.channel;
      var messageHandler = handlers[eventName];

      var ctx = req.hull;

      if (!messageHandler) {
        // FIXME: this is a notification the connector is apparently not interested in,
        // for now we default to the "success" response to keep smart-notifier work smoothly
        req.hull.smartNotifierResponse.setFlowControl(defaultSuccessFlowControl);
        var response = req.hull.smartNotifierResponse.toJSON();
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return res.status(400).json(response);
      }

      if (notification.channel === "user:update") {
        // optionally group user traits
        if (notification.messages && userHandlerOptions.groupTraits) {
          notification.messages = notification.messages.map(function (message) {
            message.user = client.utils.traits.group(message.user);
            return message;
          });
        }
      }

      var promise = messageHandler(ctx, notification.messages);

      return promise.then(function () {
        if (!req.hull.smartNotifierResponse.isValid()) {
          req.hull.smartNotifierResponse.setFlowControl(defaultSuccessFlowControl);
        }
        var response = req.hull.smartNotifierResponse.toJSON();
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return res.json(response);
      }, function (err) {
        err = err || new Error("Error while processing notification");
        err.eventName = eventName;
        err.status = err.status || 400;
        ctx.client.logger.error("connector.smartNotifierHandler.error", err.stack || err);
        if (!req.hull.smartNotifierResponse.isValid()) {
          req.hull.smartNotifierResponse.setFlowControl(defaultErrorFlowControl);
        }
        var response = req.hull.smartNotifierResponse.toJSON();
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return res.status(err.status).json(response);
      });
    } catch (err) {
      err.status = 500;
      console.error(err.stack || err);
      req.hull.smartNotifierResponse.setFlowControl(defaultErrorFlowControl);
      var _response = req.hull.smartNotifierResponse.toJSON();
      _hullClient2.default.logger.debug("connector.smartNotifierHandler.response", _response);
      return res.status(err.status).json(_response);
    }
  };
}

module.exports = function smartNotifierHandler(_ref) {
  var _ref$handlers = _ref.handlers,
      handlers = _ref$handlers === undefined ? {} : _ref$handlers,
      _ref$userHandlerOptio = _ref.userHandlerOptions,
      userHandlerOptions = _ref$userHandlerOptio === undefined ? {} : _ref$userHandlerOptio;

  var app = _express2.default.Router();
  app.use(function (req, res, next) {
    if (!req.hull.notification) {
      var e = new Error("Empty Notification");
      e.status = 400;
      return next(e);
    }
    return next();
  });
  app.use((0, _requireHullMiddleware2.default)());
  app.use(processHandlersFactory(handlers, userHandlerOptions));
  return app;
};