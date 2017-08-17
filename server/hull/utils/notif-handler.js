"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _crypto = require("crypto");

var _crypto2 = _interopRequireDefault(_crypto);

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _https = require("https");

var _https2 = _interopRequireDefault(_https);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _requireHullMiddleware = require("./require-hull-middleware");

var _requireHullMiddleware2 = _interopRequireDefault(_requireHullMiddleware);

var _batcher = require("../infra/batcher");

var _batcher2 = _interopRequireDefault(_batcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function subscribeFactory(options) {
  return function subscribe(req, res, next) {
    var message = req.hull.message;


    if (message.Type !== "SubscriptionConfirmation") {
      return next();
    }

    return _https2.default.get(message.SubscribeURL, function () {
      if (typeof options.onSubscribe === "function") {
        options.onSubscribe(req);
      }
      return res.end("subscribed");
    }, function () {
      var e = new Error("Failed to subscribe");
      e.status = 400;
      return next(e);
    });
  };
}

function getHandlerName(eventName) {
  var ModelsMapping = {
    user_report: "user",
    users_segment: "segment"
  };

  var _eventName$split = eventName.split(":"),
      _eventName$split2 = _slicedToArray(_eventName$split, 2),
      modelName = _eventName$split2[0],
      action = _eventName$split2[1];

  var model = ModelsMapping[modelName] || modelName;
  return model + ":" + action;
}

function processHandlersFactory(handlers) {
  var userHandlerOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var ns = _crypto2.default.randomBytes(64).toString("hex");
  return function process(req, res, next) {
    try {
      var _req$hull = req.hull,
          message = _req$hull.message,
          notification = _req$hull.notification,
          client = _req$hull.client,
          helpers = _req$hull.helpers,
          _req$hull$connectorCo = _req$hull.connectorConfig,
          connectorConfig = _req$hull$connectorCo === undefined ? {} : _req$hull$connectorCo;

      var eventName = getHandlerName(message.Subject);
      var messageHandlers = handlers[eventName];
      var processing = [];

      var ctx = req.hull;

      if (messageHandlers && messageHandlers.length > 0) {
        if (message.Subject === "user_report:update") {
          // optionally group user traits
          if (notification.message && notification.message.user && userHandlerOptions.groupTraits) {
            notification.message.user = client.utils.traits.group(notification.message.user);
          }
          // add `matchesFilter` boolean flag
          notification.message.matchesFilter = helpers.filterNotification(notification.message, userHandlerOptions.segmentFilterSetting || connectorConfig.segmentFilterSetting);
          processing.push(Promise.all(messageHandlers.map(function (handler, i) {
            return _batcher2.default.getHandler(ns + "-" + eventName + "-" + i, {
              ctx: ctx,
              options: {
                maxSize: userHandlerOptions.maxSize || 100,
                maxTime: userHandlerOptions.maxTime || 10000
              }
            }).setCallback(function (messages) {
              return handler(ctx, messages);
            }).addMessage(notification.message);
          })));
        } else {
          processing.push(Promise.all(messageHandlers.map(function (handler) {
            return handler(ctx, notification.message);
          })));
        }
      }

      if (processing.length > 0) {
        Promise.all(processing).then(function () {
          next();
        }, function (err) {
          err = err || new Error("Error while processing notification");
          err.eventName = eventName;
          err.status = err.status || 400;
          ctx.client.logger.error("connector.notificationHandler.error", err.stack || err);
          return next(err);
        });
      }
      return next();
    } catch (err) {
      err.status = 400;
      console.error(err.stack || err);
      return next(err);
    }
  };
}

function handleExtractFactory(_ref) {
  var handlers = _ref.handlers,
      userHandlerOptions = _ref.userHandlerOptions;

  return function handleExtract(req, res, next) {
    if (!req.body || !req.body.url || !req.body.format || !handlers["user:update"]) {
      return next();
    }

    var _req$hull2 = req.hull,
        client = _req$hull2.client,
        helpers = _req$hull2.helpers;


    return helpers.handleExtract({
      body: req.body,
      batchSize: userHandlerOptions.maxSize || 100,
      onResponse: function onResponse() {
        res.end("ok");
      },
      onError: function onError(err) {
        client.logger.error("connector.batch.error", err.stack);
        res.sendStatus(400);
      },
      handler: function handler(users) {
        var segmentId = req.query.segment_id || null;
        if (userHandlerOptions.groupTraits) {
          users = users.map(function (u) {
            return client.utils.traits.group(u);
          });
        }
        var messages = users.map(function (user) {
          var segmentIds = _lodash2.default.compact(_lodash2.default.uniq(_lodash2.default.concat(user.segment_ids || [], [segmentId])));
          return {
            user: user,
            segments: _lodash2.default.compact(segmentIds.map(function (id) {
              return _lodash2.default.find(req.hull.segments, { id: id });
            }))
          };
        });

        // add `matchesFilter` boolean flag
        messages.map(function (m) {
          if (req.query.source === "connector") {
            m.matchesFilter = helpers.filterNotification(m, userHandlerOptions.segmentFilterSetting || req.hull.connectorConfig.segmentFilterSetting);
          } else {
            m.matchesFilter = true;
          }
          return m;
        });
        return handlers["user:update"](req.hull, messages);
      }
    }).catch(function (err) {
      client.logger.error("connector.batch.error", err.stack || err);
    });
  };
}

module.exports = function notifHandler(_ref2) {
  var _ref2$handlers = _ref2.handlers,
      handlers = _ref2$handlers === undefined ? {} : _ref2$handlers,
      onSubscribe = _ref2.onSubscribe,
      _ref2$userHandlerOpti = _ref2.userHandlerOptions,
      userHandlerOptions = _ref2$userHandlerOpti === undefined ? {} : _ref2$userHandlerOpti;

  var _handlers = {};
  var app = _express2.default.Router();

  function addEventHandler(evt, fn) {
    var eventName = getHandlerName(evt);
    _handlers[eventName] = _handlers[eventName] || [];
    _handlers[eventName].push(fn);
    return this;
  }

  function addEventHandlers(eventsHash) {
    _lodash2.default.map(eventsHash, function (fn, eventName) {
      return addEventHandler(eventName, fn);
    });
    return this;
  }

  if (handlers) {
    addEventHandlers(handlers);
  }

  app.use(handleExtractFactory({ handlers: handlers, userHandlerOptions: userHandlerOptions }));
  app.use(function (req, res, next) {
    if (!req.hull.message) {
      var e = new Error("Empty Message");
      e.status = 400;
      return next(e);
    }
    return next();
  });
  app.use((0, _requireHullMiddleware2.default)());
  app.use(subscribeFactory({ onSubscribe: onSubscribe }));
  app.use(processHandlersFactory(_handlers, userHandlerOptions));
  app.use(function (req, res) {
    res.end("ok");
  });

  app.addEventHandler = addEventHandler;
  return app;
};