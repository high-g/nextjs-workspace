import PostList from "./PostList";

const initialPost = [{ id: 1, title: "Initial Post" }];

export default function Page() {
  return (
    <div>
      <PostList initialPosts={initialPost} />
    </div>
  );
}
