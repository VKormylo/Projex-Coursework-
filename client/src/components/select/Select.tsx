import { useCallback, useState } from "react";
import { useClickOutside } from "~/hooks/useClickOutside";
import { ChevronDownIcon } from "~/components/svg/Svg";

export type SelectOption = {
  value: string;
  label: string;
  className?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
};

export default function Select({ value, onChange, options, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(close, open);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b] outline-none hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
      >
        <span className={`truncate ${selected?.className ?? "text-[#0f172b]"}`}>
          {selected?.label ?? placeholder ?? ""}
        </span>
        <ChevronDownIcon className="shrink-0 text-[#62748e]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#f8fafc] ${
                o.value === value ? "font-medium text-[#3b82f6]" : (o.className ?? "text-[#0f172b]")
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
