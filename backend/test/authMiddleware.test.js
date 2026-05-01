const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../src/middlewares/authMiddleware");

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

test("auth middleware accepts a valid JWT and attaches the user", () => {
  process.env.JWT_SECRET = "test-secret";
  const token = jwt.sign({ id: "u1", role: "student" }, process.env.JWT_SECRET, { expiresIn: "30m" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let called = false;

  authMiddleware(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.user.id, "u1");
  assert.equal(req.user.role, "student");
});

test("auth middleware rejects missing tokens", () => {
  const req = { headers: {} };
  const res = mockResponse();

  authMiddleware(req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "No token provided");
});
