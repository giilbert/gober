import { MenuItem } from "./home-menu";
import { create, useStore } from "zustand";
import { cn } from "../lib/cn";
import { useEffect } from "react";
import { tracing } from "../lib/tracing";

interface Message {
  type: "log" | "error" | "warn";
  time: string;
  message: string;
}

export const tracingStore = create<{
  messages: Message[];
  addMessage: (message: Omit<Message, "time">) => void;
}>((set) => ({
  messages: [] as Message[],
  addMessage: (message: Omit<Message, "time">) => {
    const now = Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());

    set((state) => ({
      messages: [...state.messages, { ...message, time: now }],
    }));
  },
}));

export const Console: React.FC = () => {
  const store = useStore(tracingStore);

  return (
    <MenuItem name="console">
      <div className="h-64">
        {store.messages.map((message, index) => {
          return (
            <p key={index} className={cn("font-mono")}>
              {message.type === "error" && (
                <span className="bg-red-300">[ERROR]</span>
              )}
              {message.type === "warn" && (
                <span className="bg-yellow-500">[WARN]</span>
              )}
              {message.type === "log" && (
                <span className="bg-blue-300">[LOG]</span>
              )}{" "}
              {message.time}: {message.message}
            </p>
          );
        })}
      </div>
    </MenuItem>
  );
};
