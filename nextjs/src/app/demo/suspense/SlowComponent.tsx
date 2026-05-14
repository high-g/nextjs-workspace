async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function SlowComponent({ ms }: { ms: number }) {
  await sleep(ms);
  return <p>2秒後に表示されるコンテンツ</p>;
}
