"use client";

import {
  getPhilippineMobileLocal,
  PHILIPPINE_MOBILE_PLACEHOLDER,
  sanitizePhilippineMobileInput,
} from "@/lib/mobile-number";

type PhilippineMobileInputProps = {
  autoComplete?: string;
  className?: string;
  describedBy?: string;
  id: string;
  invalid?: boolean;
  name?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
};

export function PhilippineMobileInput({
  autoComplete = "tel-national",
  className = "",
  describedBy,
  id,
  invalid = false,
  name,
  onChange,
  placeholder = PHILIPPINE_MOBILE_PLACEHOLDER,
  required = false,
  value,
}: PhilippineMobileInputProps) {
  return (
    <div className={`flex min-h-11 w-full min-w-0 overflow-hidden rounded-xl border border-[#dedbd1] bg-white shadow-sm outline-none transition-colors focus-within:border-[#c7a900] focus-within:ring-4 focus-within:ring-[#fff0a8] ${className}`}>
      <span aria-hidden="true" className="flex shrink-0 items-center border-r border-[#e8e5dc] bg-[#f7f6f1] px-3.5 text-sm font-bold text-[#4a4945]">+63</span>
      <input
        aria-describedby={describedBy}
        aria-invalid={invalid}
        autoComplete={autoComplete}
        className="min-w-0 flex-1 bg-transparent px-3.5 text-sm text-[#292929] outline-none placeholder:text-[#9a978d]"
        id={id}
        inputMode="numeric"
        maxLength={10}
        minLength={10}
        name={name}
        onChange={(event) => onChange(sanitizePhilippineMobileInput(event.target.value))}
        pattern="9[0-9]{9}"
        placeholder={placeholder}
        required={required}
        type="tel"
        value={getPhilippineMobileLocal(value)}
      />
    </div>
  );
}
