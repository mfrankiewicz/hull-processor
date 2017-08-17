"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = staticRouter;

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ManifestRoute(dirname) {
  return function Manifest(req, res) {
    return res.sendFile(_path2.default.resolve(dirname, "..", "manifest.json"));
  };
}

function Readme(req, res) {
  return res.redirect("https://dashboard.hullapp.io/readme?url=https://" + req.headers.host);
}

function staticRouter() {
  var router = _express2.default.Router();

  router.use(_express2.default.static(process.cwd() + "/dist"));
  router.use(_express2.default.static(process.cwd() + "/assets"));

  router.get("/manifest.json", ManifestRoute(process.cwd() + "/dir"));
  router.get("/", Readme);
  router.get("/readme", Readme);

  return router;
}