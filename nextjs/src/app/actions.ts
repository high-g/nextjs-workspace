'use server'

import { revalidatePath } from 'next/cache'

export async function prismaSubmitMessage(formData: FormData) {
  const message = formData.get('message') as string
  console.log('サーバで受け取ったメッセージ：', message)

  const res = await fetch(`${process.env.HONO_API_URL ?? 'http://localhost:3001'}/prisma`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorId: 1, title: message }), // authorId は一旦仮
  })

  const data = await res.json()
  revalidatePath('/')
  console.log('Honoからのレスポンス:', data)
}

export async function drizzleSubmitMessage(formData: FormData) {
  const message = formData.get('message') as string
  console.log('サーバで受け取ったメッセージ：', message)

  const res = await fetch(`${process.env.HONO_API_URL ?? 'http://localhost:3001'}/drizzle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorId: 1, title: message }), // authorId は一旦仮
  })

  const data = await res.json()
  revalidatePath('/')
  console.log('Honoからのレスポンス:', data)
}
