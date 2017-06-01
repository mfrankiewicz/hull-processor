/* global describe, it */
const compute = require("../server/compute");
const { events, segments, user, ship } = require("./fixtures");
const { expect, should } = require("chai");
should();

const payload = { events, segments, user };

const CODE = {
  empty: " ",
  invalid: " return false;",
  identity: "traits({})",
  one: "traits({ domain: 'test', boom: 'bam' })",
  new_boolean: "traits({ new_boolean: true });",
  group: "traits({ line: 'test'}, { source: 'group' });",
  utils: "traits({ keys: _.keys({ a: 1, b: 2 }).join(','), host: urijs('http://hull.io/hello').host(), hello_at: moment('2016-12-01').startOf('year').format('YYYYMMDD') })",
  add_array_element: "traits({ testing_array: ['A', 'B', 'C', 'E'] })",
  modify_array_element: "traits({ testing_array: ['F', 'B', 'C', 'E'] })",
  delete_array_element: "traits({ testing_array: ['A', 'B'] })",
  array_to_string: "traits({ testing_array: 'abcdef' })",
  string_to_array: "traits({ foo: ['A', 'B'] })",
  console_log: "console.log('hello log')",
  console_debug: "console.debug('hello debug')"
};

function shipWithCode(s = {}, code = {}) {
  return {
    ...s,
    private_settings: {
      ...s.private_settings,
      code
    }
  };
}

function applyCompute(c, options) {
  return compute(payload, shipWithCode(ship, c), options);
}

describe("Compute Ship", () => {
  describe("Compute method", () => {
    it("Should not change content if code does not return", (done) => {
      applyCompute(CODE.empty)
      .then(result => {
        expect(result.user).to.be.eql(user);
        done();
      });
    });

    it("Should not change content if code returns invalid ", (done) => {
      applyCompute(CODE.invalid)
      .then(result => {
        expect(result.user).to.be.eql(user);
        done();
      });
    });

    it("Should not change content if code does not change content", (done) => {
      applyCompute(CODE.identity)
      .then(result => {
        expect(result.user).to.be.eql(user);
        done();
      });
    });

    it("Should only add the correct number of entries and nothing else", (done) => {
      applyCompute(CODE.one)
      .then(result => {
        expect(result.changes).to.deep.equal({ traits: { boom: "bam" }, domain: "test" });
        done();
      });
    });

    it("Should add trait when code adds a trait", (done) => {
      applyCompute(CODE.new_boolean)
      .then(result => {
        expect(result).to.have.deep.property("user.traits.new_boolean", true);
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(CODE.group)
      .then(result => {
        expect(result).to.have.deep.property("user.group.line", "test");
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(CODE.utils)
      .then((result) => {
        expect(result).to.have.deep.property("changes.traits.hello_at", "20160101");
        expect(result).to.have.deep.property("changes.traits.host", "hull.io");
        expect(result).to.have.deep.property("changes.traits.keys", "a,b");
        done();
      });
    });

    it("Should add an array element", (done) => {
      applyCompute(CODE.add_array_element)
      .then(result => {
        expect(result.changes.traits.testing_array).to.deep.equal(["A", "B", "C", "E"]);
        done();
      });
    });

    it("Should modify an array element", (done) => {
      applyCompute(CODE.modify_array_element)
      .then((result) => {
        expect(result.changes.traits.testing_array).to.deep.equal(["F", "B", "C", "E"]);
        done();
      });
    });

    it("Should delete an array element", (done) => {
      applyCompute(CODE.delete_array_element)
      .then((result) => {
        expect(result.changes.traits.testing_array).to.deep.equal(["A", "B"]);
        done();
      });
    });

    it("Should change an array to string", (done) => {
      applyCompute(CODE.array_to_string)
      .then((result) => {
        expect(result.changes.traits.testing_array).to.equal("abcdef");
        done();
      });
    });

    it("Should change a string to an array", (done) => {
      applyCompute(CODE.string_to_array)
      .then((result) => {
        expect(result.changes.traits.foo).to.deep.equal(["A", "B"]);
        done();
      });
    });

    it("return logs", (done) => {
      applyCompute(CODE.console_log)
      .then((result) => {
        expect(result.logs).to.deep.equal([["hello log"]]);
        done();
      });
    });

    it("return debug logs in preview mode", (done) => {
      applyCompute(CODE.console_debug, { preview: true })
      .then((result) => {
        expect(result.logs).to.deep.equal([["hello debug"]]);
        done();
      });
    });

    it("ignore debug logs in normal mode", (done) => {
      applyCompute(CODE.console_debug)
      .then((result) => {
        expect(result.logs.length).to.eql(0);
        done();
      });
    });
  });
});
