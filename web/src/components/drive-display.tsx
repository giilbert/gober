import { useEffect, useRef, useState } from "react";
import { MenuItem } from "./home-menu";
import { CarrotIcon, CircleParkingIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMafClient } from "../lib/maf-context";

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const clampI8 = (value: number) => {
  return Math.max(-128, Math.min(127, Math.round(value)));
};

export const DriveDisplay: React.FC = () => {
  const [controls, setControls] = useState<{
    drive: number;
    steer: number;
  }>({
    drive: 0,
    steer: 0,
  });
  const keysState = useRef<Record<string, boolean>>({});
  const DRIVE_MAGNITUDE = 128;
  const SLOW_FACTOR = 0.4;
  const STEER_MAGNITUDE = 64;
  const maf = useMafClient();

  useEffect(() => {
    const updateControls = (keys: Record<string, boolean>) => {
      setControls((old) => {
        const next = {
          drive: clampI8(
            DRIVE_MAGNITUDE *
              (keys["w"] ? 1 : keys["s"] ? -1 : 0) *
              (keys["shift"] ? 1 : SLOW_FACTOR)
          ),
          steer: clampI8(
            STEER_MAGNITUDE * (keys["a"] ? -1 : keys["d"] ? 1 : 0)
          ),
        };

        // console.log(old, "->", next);
        if (old.steer !== next.steer || old.drive !== next.drive) {
          maf.rpc("set_controls", next);
        }

        return next;
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLInputElement
      )
        return;
      keysState.current[event.key.toLowerCase()] = true;
      updateControls(keysState.current);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLInputElement
      )
        return;
      keysState.current[event.key.toLowerCase()] = false;
      updateControls(keysState.current);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [maf]);

  const initialAngle = controls.drive > 0 ? 135 : controls.drive < 0 ? -45 : 0;

  return (
    <MenuItem name="drive">
      <div className="flex gap-4 h-32 ">
        <div className="aspect-square bg-neutral-200 flex justify-center items-center">
          {controls.drive === 0 && <CircleParkingIcon size={72} />}
          {controls.drive !== 0 && (
            <motion.div
              initial={{
                rotate: initialAngle,
                scale:
                  Math.abs(controls.drive) / DRIVE_MAGNITUDE > 0.7 ? 1 : 0.6,
              }}
              animate={{
                rotate:
                  initialAngle +
                  35 * Math.sign(controls.drive) * clamp(controls.steer, -1, 1),
                scale:
                  Math.abs(controls.drive) / DRIVE_MAGNITUDE > 0.7 ? 1 : 0.6,
              }}
            >
              <CarrotIcon size={72} />
            </motion.div>
          )}
        </div>

        <div className="w-full text-lg">
          <p className="font-mono">wasd to move. hold shift to move slow.</p>
        </div>
      </div>
    </MenuItem>
  );
};
