"use client";

import { useOptimistic, useTransition, useState } from "react";
import { addPost } from "./action";

type Post = { id: number; title: string };

export default function PostList({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [isPending, startTransition] = useTransition();
  const [optimisticPosts, addOptimisticPost] = useOptimistic(
    posts,
    (current, newTitle: string) => [
      ...current,
      { id: Date.now(), title: `${newTitle}（送信中...）` },
    ],
  );

  function handleSubmit(formData: FormData) {
    const title = formData.get("title") as string;
    startTransition(async () => {
      addOptimisticPost(title);
      const newPost = await addPost(formData);
      setPosts((prev) => [...prev, newPost]);
    });
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input type="text" name="title" placeholder="タイトル" />
        <button type="submit" disabled={isPending}>
          追加
        </button>
      </form>
      <hr />
      <ul>
        {optimisticPosts.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </div>
  );
}
