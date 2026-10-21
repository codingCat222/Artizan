import { InputHTMLAttributes, useId } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = "", id, ...rest }: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-forest-800">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className={`rounded-xl border border-forest-100 bg-white px-3.5 py-2.5 text-sm text-forest-900 placeholder:text-forest-700/40 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100 ${className}`}
        {...rest}
      />
    </div>
  );
}
