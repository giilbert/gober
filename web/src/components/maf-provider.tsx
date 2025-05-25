import { MafClient } from "@maf/client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MafContext } from "../lib/maf-context";
import { Button } from "./button";
import { useRouter } from "@tanstack/react-router";
import { tracing } from "../lib/tracing";

type MafState =
  | {
      type: "connecting";
    }
  | {
      type: "error";
      error: {
        message: string;
      };
    }
  | {
      type: "connected";
    }
  | {
      type: "connected-and-ready";
    };

export const MafProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const clientRef = useRef<MafClient | null>(null);
  const router = useRouter();

  const [state, setState] = useState<MafState>({
    type: "connecting",
  });

  useEffect(() => {
    if (clientRef.current) {
      return;
    }

    const client = new MafClient({
      app: "gilbert/test",
      url: import.meta.env.DEV
        ? "ws://localhost:3000"
        : "https://maf-server.fly.dev",
    });
    clientRef.current = client;

    setState({ type: "connecting" });

    Promise.all([
      client.connect(),
      new Promise((resolve) =>
        setTimeout(resolve, import.meta.env.DEV ? 0 : 1000)
      ),
    ])
      .then(() => {
        if (router.state.location.pathname === "/") {
          tracing.log("connected to maf server at", client.url.toString());
          setState({ type: "connected" });
        } else {
          setState({ type: "connected-and-ready" });
        }
      })
      .catch((err) => {
        console.error(err);
        setTimeout(() => {
          setState({ type: "error", error: { message: "failed to connect" } });
        }, 1000);
      });
  }, [router.state.location.pathname]);

  // const animationDuration = import.meta.env.DEV ? 0 : 0.1;
  const animationDuration = 0.1;

  return (
    <MafContext.Provider value={clientRef.current}>
      <AnimatePresence>
        {state.type === "connected-and-ready" && (
          <motion.div
            layout
            key="connected-and-ready"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 100,
              transition: { duration: animationDuration },
            }}
            className="fixed top-0 left-0 w-screen h-screen"
          >
            {children}
          </motion.div>
        )}

        {state.type === "connected" && (
          <motion.div
            layout
            key="connected"
            className="fixed top-0 left-0 w-screen h-screen"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 100,
              transition: { duration: animationDuration },
            }}
            exit={{ opacity: 0, transition: { duration: animationDuration } }}
          >
            <Ready
              onReady={() => {
                setState({ type: "connected-and-ready" });
              }}
            />
          </motion.div>
        )}

        {state.type === "connecting" && (
          <motion.div
            layout
            key="connecting"
            className="w-screen h-screen flex items-center justify-center fixed top-0 left-0"
            exit={{ opacity: 0, transition: { duration: animationDuration } }}
          >
            <LoadingAnimation />
          </motion.div>
        )}

        {state.type === "error" && (
          <motion.div
            layout
            key="error"
            className="w-screen h-screen flex items-center justify-center fixed top-0 left-0"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 100,
              transition: { duration: animationDuration },
            }}
            exit={{ opacity: 0 }}
          >
            <p className="p-4 text-4xl font-bold">
              error: {state.error.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </MafContext.Provider>
  );
};

export const LoadingAnimation: React.FC = () => {
  const text = "Connecting...";

  return (
    <motion.p
      className="text-3xl font-bold"
      animate="animate"
      transition={{
        duration: 0.3,
        repeat: Infinity,
        staggerChildren: 0.1,
        delayChildren: 0,
      }}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          variants={{
            animate: {
              rotate: [0, -1, 0, 1, -1, 0],
              y: [0, -1, 1, 0],
            },
          }}
          transition={{
            duration: 1,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.p>
  );
};

export const Ready: React.FC<{
  onReady: () => void;
}> = ({ onReady }) => {
  return (
    <div className="flex items-center justify-center h-screen flex-col">
      <div className="space-y-2">
        <h1 className="text-3xl text-slate-950">click</h1>
        <Button className="w-full" onClick={onReady}>
          YES
        </Button>
      </div>
    </div>
  );
};
