import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import express from "express";

test("archive integration safety endpoint accepts only two Clerk test keys", async () => {
  const originalSecretKey = process.env.CLERK_SECRET_KEY;
  const originalPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/archive-route-test";
  const { default: archiveRouter } = await import("./archive");
  const app = express();
  app.use("/api", archiveRouter);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const endpoint = `http://127.0.0.1:${address.port}/api/archive/integration-test-safety`;

  async function expectStatus(secretKey: string | undefined, publishableKey: string | undefined, status: number) {
    if (secretKey === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = secretKey;
    if (publishableKey === undefined) delete process.env.CLERK_PUBLISHABLE_KEY;
    else process.env.CLERK_PUBLISHABLE_KEY = publishableKey;

    const response = await fetch(endpoint);
    assert.equal(response.status, status);
    if (status !== 204) {
      const body = await response.text();
      assert.equal(body, '{"error":"Archive integration tests require a Clerk test instance"}');
    } else {
      assert.equal(await response.text(), "");
    }
  }

  try {
    await expectStatus("sk_test_route_guard_dummy", "pk_test_route_guard_dummy", 204);
    await expectStatus("sk_live_route_guard_dummy", "pk_live_route_guard_dummy", 503);
    await expectStatus(undefined, undefined, 503);
    await expectStatus("sk_test_route_guard_dummy", undefined, 503);
    await expectStatus(undefined, "pk_test_route_guard_dummy", 503);
    await expectStatus("sk_live_route_guard_dummy", "pk_test_route_guard_dummy", 503);
    await expectStatus("sk_test_route_guard_dummy", "pk_live_route_guard_dummy", 503);
  } finally {
    if (originalSecretKey === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = originalSecretKey;
    if (originalPublishableKey === undefined) delete process.env.CLERK_PUBLISHABLE_KEY;
    else process.env.CLERK_PUBLISHABLE_KEY = originalPublishableKey;
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    server.close();
    await once(server, "close");
  }
});
