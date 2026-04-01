'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex gap-2 px-2">
      <p className="text-lg font-bold">{count}</p>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-1 rounded cursor-pointer"
      >
        カウントアップ
      </button>
    </div>
  )
}
