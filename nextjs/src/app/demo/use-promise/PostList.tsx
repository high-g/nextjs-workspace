"use client";

import { use } from "react";

type Post = {
  id: number;
  title: string;
};

export default function PostList({
  postPromise,
}: {
  postPromise: Promise<Post[]>;
}) {
  const posts = use(postPromise);

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
