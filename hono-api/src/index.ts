import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { drizzlePostRoutes } from "./routes/drizzlePosts";

const app = new Hono().route("/", drizzlePostRoutes);

export type AppType = typeof app;

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
