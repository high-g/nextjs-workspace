import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Hello from Hono!" });
});

app.get("/posts", (c) => {
  return c.json([
    { id: 1, title: "最初の投稿" },
    { id: 2, title: "2番目の投稿" },
  ]);
});

app.get("/posts/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id, title: `投稿 ${id}` });
});

app.post("/posts", async (c) => {
  const body = await c.req.json();
  console.log("受け取ったデータ：", body);
  return c.json({ id: 3, ...body }, 201);
});

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});

export default app;
