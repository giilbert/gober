import type { MafClient } from "@maf/client";
import { useMafClient } from "./maf-context";
import { use, useEffect, useState } from "react";

const isResult = (
  result: unknown
): result is { Ok: unknown } | { Err: string } => {
  return (
    (typeof result === "object" &&
      result &&
      (("Ok" in result && typeof result.Ok !== "undefined") ||
        ("Err" in result && typeof result.Err === "string"))) ||
    false
  );
};

export const rpc = async <T>(
  client: MafClient,
  method: string,
  ...args: unknown[]
) => {
  const result = await client.rpc(method, ...args);
  if (!isResult(result)) return result;

  if ("Err" in result) {
    throw new Error(result.Err);
  }

  return result.Ok as T;
};

export const useStoreSuspense = <T>(name: string) => {
  const maf = useMafClient();
  const store = maf.store<T>(name);
  use(store.init);

  const [data, setData] = useState<T>(store.data);

  useEffect(() => {
    store.on("change", setData);
  }, [store]);

  return { data, store };
};
