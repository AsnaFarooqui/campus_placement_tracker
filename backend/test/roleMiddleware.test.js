const test = require("node:test");
const assert = require("node:assert/strict");

const roleMiddleware = require("../src/middlewares/roleMiddleware");

function mockResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("role middleware allows an approved role", () => {
  const req = { user: { role: "recruiter" } };
  const res = mockResponse();
  let called = false;

  roleMiddleware("recruiter", "officer")(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(res.statusCode, null);
});

test("role middleware rejects unauthorized roles server-side", () => {
  const req = { user: { role: "student" } };
  const res = mockResponse();

  roleMiddleware("recruiter")(req, res, () => {});

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "You are not allowed to perform this action");
});
