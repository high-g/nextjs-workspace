import { Suspense } from "react";
import PostList from "./PostList";

async function fetchPosts() {
  const res = await fetch(
    "https://jsonplaceholder.typicode.com/posts?_limit=5",
  );
  return res.json();
}

export default function Page() {
  const postsPromise = fetchPosts();

  return (
    <Suspense fallback="Loading...">
      <PostList postPromise={postsPromise} />
    </Suspense>
  );
}
