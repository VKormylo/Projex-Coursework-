import type { InputHTMLAttributes, ReactNode } from "react";

type Props = {
  label?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function Checkbox({ label, className = "", ...rest }: Props) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 select-none">
      <input
        type="checkbox"
        className={`size-4 rounded border-[#3b82f6] text-[#3b82f6] accent-[#3b82f6] ${className}`}
        {...rest}
      />
      {label ? <span className="text-base font-medium leading-6 text-[#45556c]">{label}</span> : null}
    </label>
  );
}
