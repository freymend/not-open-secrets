import { app } from "./index.js";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { supabase } from "./db/index.js";
import * as argon2 from "argon2";

const EXISTING_USER = {
  username: "test",
  password: "test",
  journal: [{ "title": "Hello", "text": "Test", "color": "red", "dateCreated": "Sat Dec 09 13:39:40 PST 2023" }],
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

before(async () => {
  const hashedPassword = await argon2.hash(EXISTING_USER.password);
  await supabase.from("test_data").insert({
    username: EXISTING_USER.username,
    password: hashedPassword,
  });
});

describe("Login", () => {
  it("An existing user can login", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/login",
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        username: EXISTING_USER.username,
        password: EXISTING_USER.password,
      },
    });
    assert.strictEqual(response.json().registered, false);
  });
});

after(async () => {
  await supabase
    .from("test_data")
    .delete()
    .eq("username", EXISTING_USER.username);
  await supabase.from("test_data").delete().eq("username", NEW_USER.username);
});

describe("Backup", () => {
  it("A user can backup their data", async () => {
    const response = await app.inject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      url: "/backup",
      body: {
        username: EXISTING_USER.username,
        journal: EXISTING_USER.journal,
      },
    });
    assert.strictEqual(response.json().backedUp !== undefined, true);
  });
  it("A user can restore their data", async () => {
    const response = await app.inject({
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      url: `/restore?username=${EXISTING_USER.username}`,
    });
    assert.equal(response.json().message, EXISTING_USER.journal.message);
  });
});

app.server.close();
