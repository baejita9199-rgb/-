import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
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
}

test("server-renders the restaurant website", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="th">/i);
  assert.match(html, /ตำปูม้าคาเฟ่/);
  assert.match(html, /Food, Coffee, River &amp; Music/i);
  assert.match(html, /tel:0925353909/);
  // depth-scroll scaffold: 9 scenes inside the sticky viewport stage
  assert.match(html, /class="root"/);
  assert.match(html, /class="stage"/);
  assert.equal(html.match(/class="scene[" ]/g)?.length, 9);
  // key sections of the redesign
  assert.match(html, /จานไฮไลต์ของร้าน/);
  assert.match(html, /สั่งอะไรดี/);
  assert.match(html, /ดนตรีสดทุกค่ำคืน/);
  assert.match(html, /เจอกันริมน้ำ/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});
