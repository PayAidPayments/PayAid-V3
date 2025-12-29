import * as React from "react"
import { clsx } from "clsx"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "bg-blue-500 text-white border-transparent",
    secondary: "bg-gray-200 text-gray-800 border-transparent",
    destructive: "bg-red-500 text-white border-transparent",
    outline: "border-gray-300 text-gray-700 bg-transparent",
  }

  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }

