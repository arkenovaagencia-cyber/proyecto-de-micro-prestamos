import { InputHTMLAttributes, HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("bg-white/[0.03] border border-white/10 rounded-2xl", className)} {...props} />;
}

const badgeStyles: Record<string, string> = {
  pendiente: "bg-amber-400/10 text-amber-300",
  revision: "bg-indigo-400/10 text-indigo-300",
  aprobado: "bg-emerald-400/10 text-emerald-300",
  activo: "bg-emerald-400/10 text-emerald-300",
  pagado: "bg-[#eac888]/10 text-[#eac888]",
  rechazado: "bg-red-400/10 text-red-300",
  en_mora: "bg-red-400/10 text-red-300",
  confirmado: "bg-emerald-400/10 text-emerald-300",
};

export function Badge({ estado, children }: { estado: string; children: React.ReactNode }) {
  return (
    <span className={clsx("font-mono text-xs px-3 py-1 rounded-full whitespace-nowrap", badgeStyles[estado] || "bg-white/10 text-white/60")}>
      {children}
    </span>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-white/85 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={clsx(
          "w-full px-3.5 py-3 border rounded-xl text-sm bg-white/5 text-white placeholder-white/30 transition focus:outline-none focus:ring-2 focus:ring-[#eac888]/40 focus:border-[#eac888]/60",
          error ? "border-red-400/60" : "border-white/15",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-300 mt-1.5">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
