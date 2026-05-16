"use server";

export async function submitPost(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const title = formData.get("title") as string;

  if (!title) return { error: "タイトルは必須" };

  // 送信の遅延をシミュレート
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { success: true };
}
