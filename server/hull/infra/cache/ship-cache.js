"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jwtSimple = require("jwt-simple");

var _jwtSimple2 = _interopRequireDefault(_jwtSimple);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ShipCache = function () {

  /**
   * @param {Object} options passed to node-cache-manager
   */
  function ShipCache(ctx, cache) {
    _classCallCheck(this, ShipCache);

    this.ctx = ctx;
    this.cache = cache;
  }

  /**
   * @param {String} id the ship id
   * @return {String}
   */


  _createClass(ShipCache, [{
    key: "getShipKey",
    value: function getShipKey(id) {
      var _ctx$client$configura = this.ctx.client.configuration(),
          secret = _ctx$client$configura.secret,
          organization = _ctx$client$configura.organization;

      return _jwtSimple2.default.encode({ sub: id, iss: organization }, secret);
    }

    /**
     * Hull client calls which fetch ship settings could be wrapped with this
     * method to cache the results
     * @see https://github.com/BryanDonovan/node-cache-manager#overview
     * @param {String} id
     * @param {Function} cb callback which Promised result would be cached
     * @return {Promise}
     */

  }, {
    key: "wrap",
    value: function wrap(id, cb) {
      var shipCacheKey = this.getShipKey(id);
      return this.cache.wrap(shipCacheKey, cb);
    }

    /**
     * Saves ship data to the cache
     * @param  {String} id ship id
     * @param  {Object} ship
     * @return {Promise}
     */

  }, {
    key: "set",
    value: function set(id, ship) {
      var shipCacheKey = this.getShipKey(id);
      return this.cache.set(shipCacheKey, ship);
    }

    /**
     * Clears the ship cache. Since Redis stores doesn't return promise
     * for this method, it passes a callback to get a Promise
     * @param  {String} id
     * @return Promise
     */

  }, {
    key: "del",
    value: function del(id) {
      var _this = this;

      var shipCacheKey = this.getShipKey(id);
      return new _bluebird2.default(function (resolve, reject) {
        _this.cache.del(shipCacheKey, function (error) {
          if (error) {
            return reject(error);
          }
          return resolve();
        });
      });
    }
  }]);

  return ShipCache;
}();

exports.default = ShipCache;