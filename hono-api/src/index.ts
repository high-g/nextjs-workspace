import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { prismaPostsRoutes } from "./routes/prismaPosts";
import { drizzlePostRoutes } from "./routes/drizzlePosts";

const app = new Hono()
  .route("/prisma", prismaPostsRoutes)
  .route("/drizzle", drizzlePostRoutes);

export type AppType = typeof app;

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
