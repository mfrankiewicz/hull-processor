"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = updateSettings;
/**
 * Updates `private_settings`, touching only provided settings.
 * Also clears the `shipCache`.
 * `hullClient.put` will emit `ship:update` notify event.
 * @param {Object} ctx The Context Object
 * @param  {Object} newSettings settings to update
 * @return {Promise}
 */
function updateSettings(ctx, newSettings) {
  var client = ctx.client,
      cache = ctx.cache;

  return client.utils.settings.update(newSettings).then(function (ship) {
    ctx.ship = ship;
    if (!cache) {
      return ship;
    }
    return cache.del(ship.id).then(function () {
      return ship;
    });
  });
}