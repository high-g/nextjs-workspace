import { Hono } from "hono";
import { ResultAsync } from "neverthrow";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../lib/drizzle";
import { posts } from "../../drizzle/schema";

type PostError = { type: "not_found" } | { type: "db_error"; cause: unknown };

const PostSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  authorId: z.number().int(),
});

function findAllPosts() {
  return ResultAsync.fromPromise(
    db.query.posts.findMany({ with: { author: true } }),
    (e) => ({ type: "db_error" as const, cause: e }),
  );
}

function createPost(body: z.infer<typeof PostSchema>) {
  return ResultAsync.fromPromise(
    db.insert(posts).values(body).returning(),
    (e) => ({ type: "db_error" as const, cause: e }),
  );
}

export const neverthrowPostRoutes = new Hono()
  .get("/", async (c) => {
    const result = await findAllPosts();
    return result.match(
      (posts) => c.json(posts),
      () => c.json({ message: "Database error" }, 500),
    );
  })
  .post("/", zValidator("json", PostSchema), async (c) => {
    const body = c.req.valid("json");
    const result = await createPost(body);
    return result.match(
      (rows) => c.json(rows[0], 201),
      () => c.json({ message: "Database error" }, 500),
    );
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
    const result = await db
      .update(posts)
      .set(body)
      .where(eq(posts.id, id))
      .returning();
    if (!result[0]) return c.json({ message: "Not found" }, 404);
    return c.json(result[0]);
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    if (!result[0]) return c.json({ message: "Not found" }, 404);
    return c.body(null, 204);
  });
