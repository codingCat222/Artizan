import { HTMLAttributes } from "react";

export default function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-forest-100 bg-white p-6 shadow-card ${className}`}
      {...rest}
    />
  );
}
