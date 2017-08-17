"use strict";

var _crypto = require("hull-client/lib/lib/crypto");

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseSignedCookie(signedCookie) {
  if (!signedCookie) {
    return null;
  }
  try {
    return JSON.parse(new Buffer(signedCookie, "base64").toString("utf8"));
  } catch (e) {
    console.warn("Error parsing signed cookie", signedCookie, e.message);
  }
  return null;
}

module.exports = function CurrentUser() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var req = arguments[1];
  var res = arguments[2];
  var next = arguments[3];

  req.hull = req.hull || {};
  var cookies = req.cookies || {};
  var id = config.id;

  var cookieName = "hull_" + id;
  if (!(cookieName in cookies)) {
    return next();
  }

  var signedUser = parseSignedCookie(cookies[cookieName]);
  var userId = signedUser["Hull-User-Id"];
  var userSig = signedUser["Hull-User-Sig"];

  if (signedUser) {
    var valid = _crypto2.default.currentUserId(config, userId, userSig);
    if (valid) {
      req.hull.userId = userId;
    }
  }
  next();
};