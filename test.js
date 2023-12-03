import { app } from "./index.js";
import { describe, it } from "node:test";
import assert from "node:assert";

const EXISTING_USER = {
  username: "test",
  password: "test",
};

const NEW_USER = {
  username: "newuser",
  password: "newuser",
};

const NONEXISTING_USER = {
  username: "thisuserdoesnotexist",
  password: "thisuserdoesnotexist",
};

const WRONG_PASSWORD = {
  username: "test",
  password: "wrongpassword",
};

describe("Login", () => {
  it("An existing user can login", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/login",
      body: {
        username: EXISTING_USER.username,
        password: EXISTING_USER.password,
      },
    });
    assert.strictEqual(response.json().authenticated, true);
  });
  it("A non-existing user cannot login", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/login",
      body: {
        username: NONEXISTING_USER.username,
        password: NONEXISTING_USER.password,
      },
    });
    assert.strictEqual(response.json().authenticated, false);
  });
  it("A user with the wrong password cannot login", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/login",
      body: {
        username: WRONG_PASSWORD.username,
        password: WRONG_PASSWORD.password,
      },
    });
    assert.strictEqual(response.json().authenticated, false);
  });
});

describe("Register", () => {
  it("A new user can register", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/register",
      body: {
        username: NEW_USER.username,
        password: NEW_USER.password,
      },
    });
    assert.strictEqual(response.json().registered, true);
  });
  it("An existing user cannot register", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/register",
      body: {
        username: EXISTING_USER.username,
        password: EXISTING_USER.password,
      },
    });
    assert.strictEqual(response.json().registered, false);
  });
});

app.server.close();
