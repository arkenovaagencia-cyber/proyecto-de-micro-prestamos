import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
}

const styles = {
  primary: "bg-[#eac888] text-[#1a1305] hover:bg-[#f0d9a3]",
  ghost: "bg-transparent text-white/85 border border-white/20 hover:border-[#eac888]/50 hover:text-[#eac888]",
  danger: "bg-red-500/10 text-red-300 hover:bg-red-500/20",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-sm",
        styles[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
