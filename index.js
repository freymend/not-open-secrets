import Fastify from "fastify";
import * as argon2 from "argon2";
import {
  backup,
  getJournal,
  getPassword,
  registerUser,
  userExists,
} from "./db/index.js";

/**
 * @typedef {import('fastify').RouteShorthandOptions} RouteShorthandOptions
 */

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

export const app = Fastify({
  logger: envToLogger[process.env.NODE_ENV],
});

/**
 * @type {RouteShorthandOptions}
 */
const registerOptions = {
  schema: {
    body: {
      type: "object",
      required: ["username", "password"],
      properties: {
        username: { type: "string" },
        password: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          registered: { type: "boolean" },
        },
      },
    },
  },
};
app.post("/register", registerOptions, async (request, reply) => {
  if (await userExists(request.body.username)) {
    return { registered: false };
  }

  const hashedPassword = await argon2.hash(request.body.password);

  await registerUser(request.body.username, hashedPassword);

  return { registered: true };
});

/**
 * @type {RouteShorthandOptions}
 */
const loginOptions = {
  schema: {
    body: {
      type: "object",
      required: ["username", "password"],
      properties: {
        username: { type: "string" },
        password: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          authenticated: { type: "boolean" },
        },
      },
    },
  },
};
app.post("/login", loginOptions, async (request, reply) => {
  const data = await getPassword(request.body.username);

  if (data.length === 0) {
    return { authenticated: false };
  }

  const { password } = data[0];
  const authenticated = await argon2.verify(password, request.body.password);

  return { authenticated: authenticated };
});

/**
 * @type {RouteShorthandOptions}
 */
const backupOptions = {
  schema: {
    body: {
      type: "object",
      required: ["username", "journal"],
      properties: {
        username: { type: "string" },
        journal: { type: "array" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          backedUp: { type: "boolean" },
        },
      },
    },
  },
};
app.post("/backup", backupOptions, async (request, reply) => {
  await backup(request.body.username, request.body.journal);
  return { backedUp: new Date().toUTCString() };
});

/**
 * @type {RouteShorthandOptions}
 */
const restoreOptions = {
  schema: {
    querystring: {
      type: "object",
      required: ["username"],
      properties: {
        username: { type: "string" },
      },
    },
    response: {
      200: {
        type: "string",
      },
    },
  },
};
app.get("/restore:username", restoreOptions, async (request, reply) => {
  const journal = await getJournal(request.query.username);

  reply.header("Content-Disposition", "attachment; filename=backup.json");
  reply.header("Content-Type", "application/json");
  reply.send(JSON.stringify(journal));
});

try {
  await app.listen({ port: 3000, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
