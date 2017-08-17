"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = oauth;

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _passport = require("passport");

var _passport2 = _interopRequireDefault(_passport);

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _querystring = require("querystring");

var _querystring2 = _interopRequireDefault(_querystring);

var _requireHullMiddleware = require("./require-hull-middleware");

var _requireHullMiddleware2 = _interopRequireDefault(_requireHullMiddleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HOME_URL = "/";
var LOGIN_URL = "/login";
var CALLBACK_URL = "/callback";
var FAILURE_URL = "/failure";
var SUCCESS_URL = "/success";

function fetchToken(req, res, next) {
  var token = req.query.token || req.query.state;
  if (token && token.split(".").length === 3) {
    req.hull = req.hull || {};
    req.hull.token = token;
  }
  next();
}

function oauth(_ref) {
  var name = _ref.name,
      _ref$tokenInUrl = _ref.tokenInUrl,
      tokenInUrl = _ref$tokenInUrl === undefined ? true : _ref$tokenInUrl,
      _ref$isSetup = _ref.isSetup,
      isSetup = _ref$isSetup === undefined ? function setup() {
    return Promise.resolve();
  } : _ref$isSetup,
      _ref$onAuthorize = _ref.onAuthorize,
      onAuthorize = _ref$onAuthorize === undefined ? function onAuth() {
    return Promise.resolve();
  } : _ref$onAuthorize,
      _ref$onLogin = _ref.onLogin,
      onLogin = _ref$onLogin === undefined ? function onLog() {
    return Promise.resolve();
  } : _ref$onLogin,
      Strategy = _ref.Strategy,
      _ref$views = _ref.views,
      views = _ref$views === undefined ? {} : _ref$views,
      _ref$options = _ref.options,
      options = _ref$options === undefined ? {} : _ref$options;

  function getURL(req, url) {
    var qs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { token: req.hull.token };

    var host = "https://" + req.hostname + req.baseUrl + url;
    if (qs === false) return host;
    return host + "?" + _querystring2.default.stringify(qs);
  }
  function getURLs(req) {
    return {
      login: getURL(req, LOGIN_URL),
      success: getURL(req, SUCCESS_URL),
      failure: getURL(req, FAILURE_URL),
      home: getURL(req, HOME_URL)
    };
  }

  var router = _express2.default.Router();

  router.use((0, _requireHullMiddleware2.default)());
  router.use(fetchToken);
  router.use(_passport2.default.initialize());
  router.use(_bodyParser2.default.urlencoded({ extended: true }));

  _passport2.default.serializeUser(function (req, user, done) {
    req.user = user;
    done(null, user);
  });

  var strategy = new Strategy(_extends({}, options, { passReqToCallback: true }), function verifyAccount(req, accessToken, refreshToken, params, profile, done) {
    if (done === undefined) {
      done = profile;
      profile = params;
      params = undefined;
    }
    done(undefined, { accessToken: accessToken, refreshToken: refreshToken, params: params, profile: profile });
  });

  _passport2.default.use(strategy);

  router.get(HOME_URL, function (req, res) {
    var _req$hull = req.hull,
        _req$hull$ship = _req$hull.ship,
        ship = _req$hull$ship === undefined ? {} : _req$hull$ship,
        client = _req$hull.client;

    client.logger.debug("connector.oauth.home");
    var data = { name: name, urls: getURLs(req), ship: ship };
    isSetup(req).then(function () {
      var setup = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      res.render(views.home, _extends({}, data, setup));
    }, function () {
      var setup = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      res.render(views.login, _extends({}, data, setup));
    });
  });

  function authorize(req, res, next) {
    _passport2.default.authorize(strategy.name, _extends({}, req.authParams, {
      callbackURL: getURL(req, CALLBACK_URL, tokenInUrl ? { token: req.hull.token } : false)
    }))(req, res, next);
  }

  router.all(LOGIN_URL, function (req, res, next) {
    var client = req.hull.client;

    client.logger.debug("connector.oauth.login");
    onLogin(req).then(function () {
      return next();
    }).catch(function () {
      return next();
    });
  }, function (req, res, next) {
    req.authParams = _extends({}, req.authParams, {
      state: req.hull.token
    });
    next();
  }, authorize);

  router.get(FAILURE_URL, function loginFailue(req, res) {
    var client = req.hull.client;

    client.logger.debug("connector.oauth.failure");
    return res.render(views.failure, { name: name, urls: getURLs(req) });
  });

  router.get(SUCCESS_URL, function login(req, res) {
    var client = req.hull.client;

    client.logger.debug("connector.oauth.success");
    return res.render(views.success, { name: name, urls: getURLs(req) });
  });

  router.get(CALLBACK_URL, authorize, function (req, res) {
    var client = req.hull.client;

    client.logger.debug("connector.oauth.authorize");
    onAuthorize(req).then(function () {
      return res.redirect(getURL(req, SUCCESS_URL));
    }).catch(function (error) {
      return res.redirect(getURL(req, FAILURE_URL, { token: req.hull.token, error: error }));
    });
  });

  router.use(function (error, req, res, next) {
    // eslint-disable-line no-unused-vars
    var client = req.hull.client;

    client.logger.error("connector.oauth.error", error);
    return res.render(views.failure, { name: name, urls: getURLs(req), error: error.message || error.toString() || "" });
  });

  return router;
}