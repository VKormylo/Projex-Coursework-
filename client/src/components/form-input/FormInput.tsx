import { useId, useState, type ReactNode } from "react";
import type { FieldError, FieldValues, Path, UseFormRegister } from "react-hook-form";

import { EyeIcon, EyeOffIcon } from "~/components/svg/Svg";

type Props<TFieldValues extends FieldValues> = {
  register: UseFormRegister<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  icon?: ReactNode;
  error?: FieldError;
  id?: string;
};

export default function FormInput<TFieldValues extends FieldValues>({
  register,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  icon,
  error,
  id: idProp,
}: Props<TFieldValues>) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && reveal ? "text" : type;

  const paddingLeft = icon ? "pl-10" : "pl-3";
  const paddingRight = isPassword ? "pr-10" : "pr-3";
  const hasError = Boolean(error?.message);

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium leading-3.5 text-[#0f172b]">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#62748e]">{icon}</span>
        ) : null}
        <input
          id={id}
          type={effectiveType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`h-10 w-full rounded-lg border bg-white py-1 text-sm text-[#0f172b] outline-none placeholder:text-[#94a3b8] transition-colors ${hasError ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-200" : "border-[#e2e8f0] hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"} ${paddingLeft} ${paddingRight}`}
          {...register(name)}
        />
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Приховати пароль" : "Показати пароль"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#62748e] hover:bg-[#f1f5f9]"
          >
            {reveal ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
      {error?.message ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
