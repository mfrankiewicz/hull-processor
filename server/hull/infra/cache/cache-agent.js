"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cacheManager = require("cache-manager");

var _cacheManager2 = _interopRequireDefault(_cacheManager);

var _shipCache = require("./ship-cache");

var _shipCache2 = _interopRequireDefault(_shipCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * This is a wrapper over https://github.com/BryanDonovan/node-cache-manager
 * to manage ship cache storage.
 * It is responsible for handling cache key for every ship.
 */
var Cache = function () {

  /**
   * @param {Object} options passed to node-cache-manager
   */
  function Cache() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Cache);

    this.cache = _cacheManager2.default.caching(options);
    this.contextMiddleware = this.contextMiddleware.bind(this);
  }

  /**
   * @param {Object} client Hull Client
   */


  _createClass(Cache, [{
    key: "contextMiddleware",
    value: function contextMiddleware() {
      var _this = this;

      // eslint-disable-line class-methods-use-this
      return function (req, res, next) {
        req.hull = req.hull || {};
        req.hull.cache = req.hull.cache || new _shipCache2.default(req.hull, _this.cache);
        next();
      };
    }
  }]);

  return Cache;
}();

exports.default = Cache;