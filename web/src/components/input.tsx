import type React from "react";
import { cn } from "../lib/cn";

export const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    className?: string;
  }
> = ({ label, className, ...props }) => {
  return (
    <>
      {label && <label htmlFor={props.id}>{label}</label>}
      <input
        className={cn(
          "border border-neutral-950 w-full outline-none focus:ring-1 px-3 py-2",
          className
        )}
        {...props}
      ></input>
    </>
  );
};
