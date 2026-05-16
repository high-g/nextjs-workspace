"use client";

import { useActionState } from "react";
import { submitPost } from "./action";

export default function PostForm() {
  const [state, formAction, isPending] = useActionState(submitPost, null);

  return (
    <form action={formAction}>
      <input name="title" placeholder="タイトル" />
      <button type="submit" disabled={isPending}>
        {isPending ? "送信中..." : "送信"}
      </button>
      {state?.error && <p style={{ color: "red" }}>{state.error}</p>}
      {state?.success && <p style={{ color: "green" }}>送信成功！</p>}
    </form>
  );
}
