import assert from "node:assert/strict";
import { access, stat } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders every marketplace route", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("routes", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const routes = [
    "/", "/explore", "/search", "/listing/1", "/sell", "/messages",
    "/saved", "/cart", "/checkout", "/contact", "/faq", "/authentication",
    "/authentication-center", "/verify/VL-4824", "/brands", "/stories", "/stories/1",
    "/professional-sellers", "/terms", "/privacy", "/returns", "/buyer-protection",
    "/prohibited-items", "/shipping-policy", "/notifications", "/orders",
    "/profile", "/dashboard", "/settings",
  ];

  for (const route of routes) {
    const response = await worker.fetch(
      new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 200, `${route} should render`);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  }
});

test("ships the real Pexels demo catalog locally", async () => {
  const assets = [
    "hero.webp", "bag-one.webp", "blazer-one.webp", "sneaker-one.webp",
    "watch-one.webp", "sunglasses-one.webp", "bracelet-one.webp",
    "perfume-one.webp", "bag-two.webp",
  ];
  for (const asset of assets) {
    const url = new URL(`../public/assets/${asset}`, import.meta.url);
    await access(url);
    const info = await stat(url);
    assert.ok(info.size < 300_000, `${asset} should stay below 300 KB`);
  }
});

test("ships optimized marketplace imagery", async () => {
  const assets = [
    "hero-editorial.webp", "editorial-luxury.webp", "bags-triptych.webp",
    "apparel-triptych.webp", "collectibles-triptych.webp",
  ];
  for (const asset of assets) {
    const url = new URL(`../public/assets/${asset}`, import.meta.url);
    await access(url);
    const info = await stat(url);
    assert.ok(info.size < 150_000, `${asset} should stay below 150 KB`);
  }
});
