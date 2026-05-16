"use server";

export async function addPost(formData: FormData) {
  const title = formData.get("title") as string;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { id: Date.now(), title };
}
