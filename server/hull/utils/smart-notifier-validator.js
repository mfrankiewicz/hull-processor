"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _express = require("express");

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _request = require("request");

var _request2 = _interopRequireDefault(_request);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _jsonwebtoken = require("jsonwebtoken");

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var certCache = {};

var SmartNotifierValidator = function () {
  function SmartNotifierValidator() {
    _classCallCheck(this, SmartNotifierValidator);
  }

  _createClass(SmartNotifierValidator, [{
    key: "setRequest",
    value: function setRequest(request) {
      this.request = request;
      return this;
    }
  }, {
    key: "hasFlagHeader",
    value: function hasFlagHeader() {
      return _lodash2.default.has(this.request.headers, "x-hull-smart-notifier");
    }
  }, {
    key: "validatePayload",
    value: function validatePayload() {
      if (!this.request.body) {
        return false;
      }
      return true;
    }
  }, {
    key: "validateConfiguration",
    value: function validateConfiguration() {

      if (!this.request.body.configuration) {
        console.log("Error in validation");
        console.log(this.request.body);
        console.log(this.request.body.configuration);
        return false;
      }
      return true;
    }
  }, {
    key: "validateSignature",
    value: function validateSignature() {
      var _this = this;

      return this.getCertificate().then(function (certificate) {
        try {
          var decoded = _jsonwebtoken2.default.verify(_this.request.headers["x-hull-smart-notifier-signature"], certificate, { algorithms: ["RS256"], jwtid: _this.request.body.notification_id });
          if (decoded) {
            return _bluebird2.default.resolve(true);
          }
          return _bluebird2.default.reject(new Error("Signature invalid"));
        } catch (err) {
          return _bluebird2.default.reject(new Error("Signature invalid"));
        }
      });
    }
  }, {
    key: "getCertificate",
    value: function getCertificate() {
      var certUrl = this.request.headers["x-hull-smart-notifier-signature-public-key-url"];
      var signature = this.request.headers["x-hull-smart-notifier-signature"];
      if (_lodash2.default.has(certCache, certUrl)) {
        return _bluebird2.default.resolve(_lodash2.default.get(certCache, certUrl));
      }
      return new _bluebird2.default(function (resolve, reject) {
        _request2.default.post(certUrl, { body: signature }, function (error, response, body) {
          if (error) {
            return reject(error);
          }
          certCache[certUrl] = body;
          return resolve(body);
        });
      });
    }
  }]);

  return SmartNotifierValidator;
}();

exports.default = SmartNotifierValidator;