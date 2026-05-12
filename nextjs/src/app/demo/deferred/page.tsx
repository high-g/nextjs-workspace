"use client";

/**
 * useDeferredValue Sample
 */

import { useState, useDeferredValue } from "react";

const ITEMS = Array.from({ length: 1000 }, (_, i) => `アイテム ${i}`);

function SlowItem({ text }: { text: string }) {
  const start = Date.now();
  while (Date.now() - start < 1) {}
  return <li>{text}</li>;
}

function HeavyList({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const filtered = ITEMS.filter((item) => item.includes(deferredQuery));

  return (
    <>
      {/* <p>useDeferredValueなし：{query}</p> */}
      <p>useDeferredValueあり：{deferredQuery}</p>
      <ul>
        {filtered.map((item) => (
          <SlowItem key={item} text={item} />
        ))}
      </ul>
    </>
  );
}

export default function DeferredDemo() {
  const [query, setQuery] = useState("");

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="絞り込み"
      />
      <HeavyList query={query} />
    </div>
  );
}
