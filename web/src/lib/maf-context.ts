import { MafClient } from "@maf/client";
import { createContext, use } from "react";

export const MafContext = createContext<MafClient | null>(null);

export const useMafClient = () => {
  const maf = use(MafContext);
  if (!maf) throw new Error("useMaf must be used within a MafProvider");
  return maf;
};
