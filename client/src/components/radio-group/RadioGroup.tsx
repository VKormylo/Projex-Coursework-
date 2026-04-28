import type { ReactNode } from 'react'

export interface RadioOption<T extends string> {
  value: T
  label: string
  description?: string
}

type Props<T extends string> = {
  name: string
  legend?: ReactNode
  options: RadioOption<T>[]
  value: T
  onChange: (value: T) => void
  error?: string
}

export default function RadioGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  error,
}: Props<T>) {
  return (
    <fieldset className="flex w-full flex-col gap-3">
      {legend ? (
        <legend className="text-sm font-medium leading-[14px] text-[#0a0a0a]">
          {legend}
        </legend>
      ) : null}
      <div className="flex flex-col gap-3.5">
        {options.map((o) => {
          const checked = o.value === value
          return (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2"
            >
              <span
                className={`relative flex size-4 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm ${
                  checked ? 'border-[#3b82f6]' : 'border-black/10'
                }`}
              >
                <input
                  type="radio"
                  name={name}
                  value={o.value}
                  checked={checked}
                  onChange={() => onChange(o.value)}
                  className="absolute inset-0 size-4 cursor-pointer opacity-0"
                />
                {checked ? (
                  <span className="size-2 rounded-full bg-[#3b82f6]" aria-hidden />
                ) : null}
              </span>
              <span className="text-sm font-normal leading-[14px] text-[#0a0a0a]">
                {o.label}
              </span>
            </label>
          )
        })}
      </div>
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
