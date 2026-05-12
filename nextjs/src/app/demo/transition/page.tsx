"use client";
/**
 * useTransition Sample
 * テキスト入力中に、UIがカクつくような重い処理をuseTransitionでラップすると、入力の快適さを保ったまま重い処理を実行できる
 */

import { useState, useTransition } from "react";

const ITEMS = Array.from({ length: 1000 }, (_, i) => `アイテム ${i}`);

export default function TransitionDemo() {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState(ITEMS);
  const [isPending, startTransition] = useTransition();

  function SlowItem({ text }: { text: string }) {
    const start = Date.now();
    while (Date.now() - start < 1) {} // 200ms ブロック
    return <li>{text}</li>;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);

    // setFiltered(ITEMS.filter((item) => item.includes(value)));

    startTransition(() => {
      setFiltered(ITEMS.filter((item) => item.includes(value)));
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} placeholder="絞り込み" />
      {isPending && <p>Pending...</p>}
      <ul>
        {filtered.map((item) => (
          <SlowItem key={item} text={item} />
        ))}
      </ul>
    </div>
  );
}
