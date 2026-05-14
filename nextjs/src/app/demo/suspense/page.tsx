import { Suspense } from "react";
import SlowComponent from "./SlowComponent";

export default function Page() {
  return (
    <div>
      <h1>Suspenseテスト</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SlowComponent ms={2000} />
      </Suspense>
    </div>
  );
}
