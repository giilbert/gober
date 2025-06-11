import { tracingStore } from "../components/console";

export const tracing = {
  log: (...message: string[]) => {
    tracingStore
      .getState()
      .addMessage({ type: "log", message: message.join(" ") });
    console.log(...message);
  },
  error: (...message: string[]) => {
    tracingStore
      .getState()
      .addMessage({ type: "error", message: message.join(" ") });
    console.error(...message);
  },
  warn: (...message: string[]) => {
    tracingStore
      .getState()
      .addMessage({ type: "warn", message: message.join(" ") });
    console.warn(...message);
  },
};
