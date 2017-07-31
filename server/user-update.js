
import compute from "./compute";
import _ from "lodash";
import isGroup from "./is-group-trait";
import Bottleneck from "bottleneck";

function flatten(obj, key, group) {
  return _.reduce(group, (m, v, k) => {
    const n = (key) ? `${key}/${k}` : k;
    if (isGroup(v)) {
      flatten(m, n, v);
    } else {
      m[n] = v;
    }
    return m;
  }, obj);
}

const cluster = new Bottleneck.Cluster(3, 100);

module.exports = function handle({ message = {} }, { ship, hull }) {
  const { user, segments } = message;
  const asUser = hull.asUser(user);
  asUser.logger.info("incoming.user.start");
  return cluster.key(ship.id)
  .schedule(compute, message, ship)
  .then(({ changes, events, account, accountClaims, logs, errors }) => {
    // Update user traits
    if (_.size(changes.user)) {
      const flat = {
        ...changes.user.traits,
        ...flatten({}, "", _.omit(changes.user, "traits")),
      };

      if (_.size(flat)) {
        asUser.logger.info("incoming.user.success", { changes: flat });
        if (flat.email) {
          hull.asUser({ id: user.id, email: flat.email }).traits(flat);
        } else {
          asUser.traits(flat);
        }
      }
    } else {
      asUser.logger.info("incoming.user.skip", { message: "No Changes" });
    }

    // Update account traits
    if (_.size(changes.account)) {
      const flat = flatten({}, "", changes.account);

      if (_.size(flat)) {
        const asAccount = asUser.account(accountClaims);
        asAccount.traits(flat);
        asAccount.logger.info("incoming.account.success", { changes: flat });
      }
    } else if (_.size(accountClaims) && (_.size(account) || !_.isMatch(account, accountClaims))) {
      // Link account
      asUser.account(accountClaims).traits({});
      asUser.logger.info("incoming.account.link", { account: _.pick(account, "id"), accountClaims });
    }

    if (events.length > 0) {
      events.map(({ eventName, properties, context }) => {
        asUser.logger.info("incoming.event.track", { properties, eventName });
        return asUser.track(eventName, properties, { ip: "0", source: "processor", ...context });
      });
    }

    if (errors && errors.length > 0) {
      asUser.logger.info("incoming.user.error", { errors, sandbox: true });
    }

    if (logs && logs.length) {
      logs.map(log => asUser.logger.info("compute.user.log", { log }));
    }
  })
  .catch(err => {
    console.log("error:", { err, message: err.message });
    asUser.logger.info("incoming.user.error", { err, user, segments, sandbox: false });
  });
};
