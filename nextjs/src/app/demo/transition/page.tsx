"use client";
/**
 * useTransition Sample
 * テキスト入力t中に重い処理を走らせると、UIがカクつくような重い処理をuseTransitionでラップすると、入力の快適さを保ったまま重い処理を実行できる
 */

import { useState, useTransition } from "react";

const ITEMS = Array.from({ length: 1000 }, (_, i) => `aいて無 ${i}`);

export default function TransitionDemo() {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState(ITEMS);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
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
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
