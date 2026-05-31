import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { drizzlePostRoutes } from "./routes/drizzlePosts";
import { neverthrowPostRoutes } from "./routes/neverthrowPosts";

const app = new Hono()
  .route("/", drizzlePostRoutes)
  .route("/neverthrow", neverthrowPostRoutes);

export type AppType = typeof app;

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
