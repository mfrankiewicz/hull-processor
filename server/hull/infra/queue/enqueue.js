"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = enqueue;
function enqueue(queueAdapter, ctx, jobName, jobPayload) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

  var _ctx$client$configura = ctx.client.configuration(),
      id = _ctx$client$configura.id,
      secret = _ctx$client$configura.secret,
      organization = _ctx$client$configura.organization;

  var context = {
    hostname: ctx.hostname,
    query: {
      ship: id,
      secret: secret,
      organization: organization
    }
  };
  var queueName = options.queueName || "queueApp";

  return queueAdapter.create(queueName, {
    name: jobName,
    payload: jobPayload,
    context: context
  }, options);
}