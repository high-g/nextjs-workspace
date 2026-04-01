import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../lib/prisma";

const PostSchema = z.object({
  title: z.string().min(1, "タイトルは1文字以上必要です"),
  content: z.string().optional(),
  authorId: z.number().int(),
});

export const prismaPostsRoutes = new Hono()
  .get("/", async (c) => {
    const posts = await prisma.post.findMany({
      include: { author: true },
    });
    return c.json(posts);
  })
  .post("/", zValidator("json", PostSchema), async (c) => {
    const body = c.req.valid("json");
    const post = await prisma.post.create({ data: body });
    return c.json(post, 201);
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const post = await prisma.post.findUnique({ where: { id }, include: { author: true } });
    if (!post) return c.json({ error: "Not found" }, 404);
    return c.json(post);
  })
  .put("/:id", zValidator("json", PostSchema.partial()), async (c) => {
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    try {
      const post = await prisma.post.update({ where: { id }, data: body });
      return c.json(post);
    } catch {
      return c.json({ error: "Not found" }, 404);
    }
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    try {
      await prisma.post.delete({ where: { id } });
      return c.body(null, 204);
    } catch {
      return c.json({ error: "Not found" }, 404);
    }
  });
