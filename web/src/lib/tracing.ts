import { tracingStore } from "../components/console";

export const tracing = {
  log: (...message: string[]) => {
    tracingStore
      .getState()
      .addMessage({ type: "log", message: message.join(" ") });
  },
  error: (...message: string[]) => {
    tracingStore
      .getState()
      .addMessage({ type: "error", message: message.join(" ") });
  },
  warn: (...message: string[]) => {
    tracingStore
      .getState()
      .addMessage({ type: "warn", message: message.join(" ") });
  },
};
