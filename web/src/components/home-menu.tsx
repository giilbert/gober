import { cn } from "../lib/cn";
import { Console } from "./console";
import { DriveDisplay } from "./drive-display";
import { SoundControlsDisplay } from "./sound-controls-display";

export const HomeMenu: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 h-full">
      <DriveDisplay />
      <SoundControlsDisplay />
      <Console />
    </div>
  );
};

export const MenuItem: React.FC<{
  name: string;
  children: React.ReactNode;
  className?: string;
}> = ({ name, children, className }) => {
  return (
    <div className={cn("border px-3 py-2", className)}>
      <p className="bg-white -mt-4 -ml-2 w-min px-2">{name}</p>
      {children}
    </div>
  );
};
