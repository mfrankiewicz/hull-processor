"use strict";

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _jwtSimple = require("jwt-simple");

var _jwtSimple2 = _interopRequireDefault(_jwtSimple);

var _helpers = require("../helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseQueryString(query) {
  return ["organization", "ship", "secret"].reduce(function (cfg, k) {
    var val = (query[k] || "").trim();
    if (typeof val === "string") {
      cfg[k] = val;
    } else if (val && val[0] && typeof val[0] === "string") {
      cfg[k] = val[0].trim();
    }
    return cfg;
  }, {});
}

function parseToken(token, secret) {
  if (!token || !secret) {
    return false;
  }
  try {
    var config = _jwtSimple2.default.decode(token, secret);
    return config;
  } catch (err) {
    var e = new Error("Invalid Token");
    e.status = 401;
    throw e;
  }
}

module.exports = function hullClientMiddlewareFactory(Client, _ref) {
  var hostSecret = _ref.hostSecret,
      _ref$clientConfig = _ref.clientConfig,
      clientConfig = _ref$clientConfig === undefined ? {} : _ref$clientConfig;

  function getCurrentShip(id, client, cache, bust, notification) {
    if (notification && notification.connector) {
      return Promise.resolve(notification.connector);
    }

    return function () {
      if (cache && bust) {
        return cache.del(id);
      }
      return Promise.resolve();
    }().then(function () {
      if (cache) {
        return cache.wrap(id, function () {
          return client.get(id, {}, {
            timeout: 5000,
            retry: 1000
          });
        });
      }
      return client.get(id, {}, {
        timeout: 5000,
        retry: 1000
      });
    });
  }

  return function hullClientMiddleware(req, res, next) {
    req.hull = req.hull || {};

    try {
      // Try to fetch config, or create it based on query string parameters or Token
      req.hull.config = req.hull.config || parseToken(req.hull.token, hostSecret) || parseQueryString(req.query) || {};
      var _req$hull = req.hull,
          message = _req$hull.message,
          notification = _req$hull.notification,
          config = _req$hull.config;
      var organization = config.organization,
          id = config.ship,
          secret = config.secret;

      if (organization && id && secret) {
        req.hull.client = new Client(_lodash2.default.merge({ id: id, secret: secret, organization: organization }, clientConfig));
        req.hull.client.utils = req.hull.client.utils || {};
        req.hull.client.utils.extract = {
          handle: function handle(options) {
            return (0, _helpers.handleExtract)(req.hull, options);
          },
          request: function request(options) {
            return (0, _helpers.requestExtract)(req.hull, options);
          }
        };

        req.hull.token = _jwtSimple2.default.encode(config, hostSecret);

        var bust = message && message.Subject === "ship:update";

        // Promise<ship>
        return getCurrentShip(id, req.hull.client, req.hull.cache, bust, notification).then(function () {
          var ship = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

          req.hull.ship = ship;
          req.hull.hostname = req.hostname;
          req.hull.options = _lodash2.default.merge(req.query, req.body);
          return next();
        }, function (err) {
          var e = new Error(err.message);
          e.status = 401;
          return next(e);
        });
      }
      return next();
    } catch (err) {
      try {
        err.status = 401;
        return next(err);
      } catch (err2) {
        // Fallback the fallback
        console.warn("Unknown Error:", err2);
      }
    }
    return next();
  };
};