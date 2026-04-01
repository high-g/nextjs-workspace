import Counter from '@/components/Counter'
import { prismaSubmitMessage, drizzleSubmitMessage } from './actions'
import { client } from '@/lib/client'

// Prisma 経由
async function getPrismaPost() {
  const res = await client.prisma.$get({}, { init: { cache: 'no-store' } })
  return res.json()
}

// Drizzle 経由
async function getDrizzlePost() {
  const res = await client.drizzle.$get({}, { init: { cache: 'no-store' } })
  return res.json()
}

export default async function Home() {
  const prismaPosts = await getPrismaPost()
  const drizzlePosts = await getDrizzlePost()

  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">{process.env.NEXT_PUBLIC_APP_NAME || ''}</h1>
      <Counter />

      <hr className="my-4" />

      <h2 className="text-xl font-bold mb-4">Prisma Posts</h2>
      <form action={prismaSubmitMessage} className="flex gap-2">
        <input
          name="message"
          type="text"
          placeholder="Prisma経由でDBに登録する内容を入力"
          className="border border-gray-300 rounded p-1"
        />
        <button type="submit" className="bg-gray-500 hover:bg-gray-700 text-white font-bold px-2 rounded">
          送信
        </button>
      </form>

      <table>
        <tbody>
          {prismaPosts.map((post: { id: number; title: string }) => (
            <tr key={post.id}>
              <td>{post.id}</td>
              <td>{post.title}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="my-4" />

      <h2 className="text-xl font-bold mb-4">Drizzle Posts</h2>
      <form action={drizzleSubmitMessage} className="flex gap-2">
        <input
          name="message"
          type="text"
          placeholder="Drizzle経由でDBに登録する内容を入力"
          className="border border-gray-300 rounded p-1"
        />
        <button type="submit" className="bg-gray-500 hover:bg-gray-700 text-white font-bold px-2 rounded">
          送信
        </button>
      </form>
      <table>
        <tbody>
          {drizzlePosts.map((post: { id: number; title: string }) => (
            <tr key={post.id}>
              <td>{post.id}</td>
              <td>{post.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
