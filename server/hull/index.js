"use strict";

var _hullClient = require("hull-client");

var _hullClient2 = _interopRequireDefault(_hullClient);

var _client = require("./middleware/client");

var _client2 = _interopRequireDefault(_client);

var _hullConnector = require("./connector/hull-connector");

var _hullConnector2 = _interopRequireDefault(_hullConnector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_hullClient2.default.Middleware = _client2.default.bind(undefined, _hullClient2.default);
_hullClient2.default.Connector = _hullConnector2.default.bind(undefined, _hullClient2.default);

module.exports = _hullClient2.default;