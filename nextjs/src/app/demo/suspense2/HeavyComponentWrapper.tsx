"use client";

import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Page() {
  return <HeavyComponent />;
}
