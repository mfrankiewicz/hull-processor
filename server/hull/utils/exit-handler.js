"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exitHandler;
/**
 * @param {Promise} promise
 */
function exitHandler(promise) {
  function exitNow() {
    console.warn("connector.exitHandler.exitNow");
    process.exit(0);
  }

  function handleExit() {
    var waiting = 30000;
    console.log("connector.exitHandler.handleExit", { waiting: waiting });
    setTimeout(exitNow, waiting);
    promise().then(exitNow, exitNow);
  }

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
  process.on("gracefulExit", handleExit);
}