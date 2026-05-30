import { ok, err, Result, ResultAsync } from "neverthrow";

// Result<T, E> = Ok<T> | Err<E>
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("division by zero");
  return ok(a / b);
}

const result = divide(10, 2);

// パターン1: match
result.match(
  (val) => console.log("ok: ", val),
  (e) => console.log("err: ", e),
);

// パターン2: isOk / isErr
if (result.isOk()) {
  console.log("ok: ", result.value);
}
if (result.isErr()) {
  console.log("err: ", result.error);
}

// パターン3: andThen チェーン
const result2 = divide(10, 2)
  .andThen((n) => divide(n, 2)) // Okなら次の計算
  .map((n) => n * 100) // Okなら変換
  .mapErr((e) => `Err: ${e}`); // Errなら変換

result2.match(
  (val) => console.log("ok: ", val),
  (e) => console.log("err: ", e),
);

type Post = { id: number; title: string; body: string; userId: number };

// ResultAsync
function fetchUser(id: number) {
  return ResultAsync.fromPromise(
    fetch(`https://jsonplaceholder.typicode.com/posts/${id}`).then(
      (r) => r.json() as Promise<Post>,
    ),
    (e) => ({ type: "fetch_error" as const, cause: e }),
  );
}

fetchUser(1)
  .andThen((user) => (user ? ok(user) : err({ type: "not_found" as const })))
  .match(
    (user) => console.log(user),
    (e) => console.log(e.type),
  );
