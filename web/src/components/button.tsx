import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { cn } from "../lib/cn";
import { useState } from "react";

export const buttonStyles = cva(
  "hover:scale-110 transition-all hover:cursor-pointer active:scale-90",
  {
    variants: {
      variant: {
        primary:
          "bg-slate-950 text-white hover:shadow-xl/10 active:shadow-none",
      },
      size: {
        sm: "px-2 py-1 text-sm",
        md: "px-4 py-2 text-md",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const rotateStyles = [
  "active:rotate-0",
  "active:rotate-2",
  "active:-rotate-2",
  "active:rotate-6",
  "active:-rotate-6",
];

export const chooseRandomRotate = () => {
  const randomIndex = Math.floor(Math.random() * rotateStyles.length);
  return rotateStyles[randomIndex];
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonStyles>
> = ({ variant, size, className, children, ...props }) => {
  const [randomRotate, setRandomRotate] = useState(chooseRandomRotate());

  return (
    <button
      className={cn(randomRotate, buttonStyles({ variant, size, className }))}
      {...props}
      onClick={(e) => {
        setRandomRotate(chooseRandomRotate);
        props.onClick?.(e);
      }}
    >
      {children}
    </button>
  );
};
