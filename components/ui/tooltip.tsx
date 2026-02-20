"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Try to import radix tooltip, fallback to stub if not available
let TooltipPrimitive: any
try {
  TooltipPrimitive = require("@radix-ui/react-tooltip")
} catch {
  // Fallback stub implementation
  TooltipPrimitive = {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Trigger: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
      ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />
    ),
    Content: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }>(
      ({ className, sideOffset = 4, ...props }, ref) => (
        <div
          ref={ref}
          className={cn(
            "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
            className
          )}
          {...props}
        />
      )
    ),
  }
  if (TooltipPrimitive.Trigger) {
    TooltipPrimitive.Trigger.displayName = "TooltipTrigger"
  }
  if (TooltipPrimitive.Content) {
    TooltipPrimitive.Content.displayName = "TooltipContent"
  }
}

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
