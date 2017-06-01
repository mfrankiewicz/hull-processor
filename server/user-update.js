import compute from "./compute";
import _ from "lodash";
import isGroup from "./is-group-trait";
import Bottleneck from "bottleneck";
// import _ from "lodash";

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

  return cluster.key(ship.id)
  .schedule(compute, message, ship)
  .then(({ changes, events, errors, logs }) => {
    try {
      const asUser = hull.as(user.id);

      hull.logger.debug("compute.user.debug", { id: user.id, email: user.email, changes });

      if (_.size(changes)) {
        const flat = {
          ...changes.traits,
          ...flatten({}, "", _.omit(changes, "traits")),
        };

        if (_.size(flat)) {
          hull.logger.info("compute.user.computed", { id: user.id, email: user.email, changes: flat });
          asUser.traits(flat);
        }
      }

      if (errors && errors.length > 0) {
        hull.logger.error("compute.user.error", { id: user.id, email: user.email, errors });
      }

      if (events.length > 0) {
        events.map(({ eventName, properties, context }) => asUser.track(eventName, properties, { ip: "0", source: "processor", ...context }));
      }

      if (logs && logs.length) {
        logs.map(log => hull.logger.info("compute.console.log", { id: user.id, email: user.email, log }));
      }
    } catch (err) {
      hull.logger.error("compute.error", { err, user, segments, errors, changes, events, logs });
    }
  })
  .catch(err => {
    hull.logger.error(err);
  });
};
