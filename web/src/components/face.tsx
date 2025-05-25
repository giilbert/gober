import { CircleIcon } from "lucide-react";
import { motion, useMotionValue, animate } from "motion/react";
import { useEffect, useRef } from "react";

export const Face: React.FC<{
  removeFace: () => void;
}> = ({ removeFace }) => {
  const y1 = useMotionValue(15);

  const hasRun = useRef(false);
  useEffect(() => {
    async function run() {
      while (true) {
        const eyelidsOpenTime = Math.random() * 1000 + 2500;
        await new Promise((resolve) => setTimeout(resolve, eyelidsOpenTime));

        animate(y1, 85, {
          duration: 0.04,
          ease: "easeInOut",
        });
        const eyelidsCloseTime = Math.random() * 100 + 50;
        await new Promise((resolve) => setTimeout(resolve, eyelidsCloseTime));
        animate(y1, 15, {
          duration: 0.07,
          ease: "easeInOut",
        });
      }
    }

    if (!hasRun.current) {
      hasRun.current = true;
      run();
    }
  }, [y1]);

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-white flex flex-col">
      <div className="bg-neutral-900 w-full h-8 text-white px-2 font-bold flex items-center gap-2">
        <CircleIcon size={16} fill="currentColor" className="text-red-500" />
        <p>Don&apos;t break me! You&apos;re on camera.</p>
      </div>

      <div className="h-full w-full flex items-center justify-center">
        <div className="aspect-square h-full">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <motion.line
              x1="25"
              y1={y1}
              x2="25"
              y2="85"
              stroke="black"
              strokeWidth="8"
              strokeLinecap="round"
              animate={{
                transition: {
                  ease: "easeInOut",
                },
              }}
            />

            <motion.line
              x1="75"
              y1={y1}
              x2="75"
              y2="85"
              stroke="black"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="bg-neutral-900 w-full h-8 text-white px-2 py-1 font-bold flex">
        <p
          onClick={() => {
            removeFace();
          }}
        >
          Gober: Made with ❤️ by Gilbert in 2N4.
        </p>
        <p className="ml-auto">github.com/giilbert/gober</p>
      </div>
    </div>
  );
};
