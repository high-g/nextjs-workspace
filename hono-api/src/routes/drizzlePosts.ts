import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../lib/drizzle";
import { posts } from "../../drizzle/schema";

const PostSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  authorId: z.number().int(),
});

export const drizzlePostRoutes = new Hono()
  .get("/", async (c) => {
    const allPosts = await db.query.posts.findMany({
      with: { author: true },
    });
    return c.json(allPosts);
  })
  .post("/", zValidator("json", PostSchema), async (c) => {
    const body = c.req.valid("json");
    const result = await db.insert(posts).values(body).returning();
    return c.json(result[0], 201);
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: { author: true },
    });
    if (!post) return c.json({ message: "Not found" }, 404);
    return c.json(post);
  })
  .put("/:id", zValidator("json", PostSchema.partial()), async (c) => {
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const result = await db.update(posts).set(body).where(eq(posts.id, id)).returning();
    if (!result[0]) return c.json({ message: "Not found" }, 404);
    return c.json(result[0]);
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    if (!result[0]) return c.json({ message: "Not found" }, 404);
    return c.body(null, 204);
  });
