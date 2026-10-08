import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../web/sw.js", import.meta.url), "utf8");

test("Local preview prefers current files and retains an offline fallback", async () => {
  for (const hostname of ["localhost", "127.0.0.1", "[::1]"]) {
    const handlers = {};
    let offline = false;
    vm.runInNewContext(source, {
      self: {
        location: { hostname },
        addEventListener: (name, handler) => {
          handlers[name] = handler;
        },
      },
      caches: { match: async () => "cached game" },
      fetch: async () => {
        if (offline) throw new Error("Offline");
        return "updated game";
      },
    });
    let response;
    const request = {
      request: { method: "GET" },
      respondWith: (promise) => {
        response = promise;
      },
    };
    handlers.fetch(request);
    assert.equal(await response, "updated game");
    offline = true;
    handlers.fetch(request);
    assert.equal(await response, "cached game");
  }
});

test("Public game retains cache-first offline play", async () => {
  let handler;
  vm.runInNewContext(source, {
    self: {
      location: { hostname: "littlequest.daniel-andres.com" },
      addEventListener: (name, callback) => {
        if (name === "fetch") handler = callback;
      },
    },
    caches: { match: async () => "cached game" },
    fetch: () => {
      assert.fail("Cached public assets must not need a network connection");
    },
  });
  let response;
  handler({
    request: { method: "GET" },
    respondWith: (promise) => {
      response = promise;
    },
  });
  assert.equal(await response, "cached game");
});
