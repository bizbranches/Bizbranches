import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles only (no CTA-specific skew/shadow here)
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Set to false to opt-out of the global CTA animation for specific buttons */
    animated?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  animated = true,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : ("button" as const)

  // Base classes (no CTA effect)
  const baseClasses = cn(
    buttonVariants({ variant, size }),
    "select-none",
    className
  )

  // CTA effect classes (skew + drop shadow) only when animated
  const ctaClasses = animated
    ? cn(
        "group skew-x-[-12deg]",
        "[box-shadow:6px_6px_0_#000] hover:[box-shadow:10px_10px_0_var(--btn-shadow-accent,#fbc638)]"
      )
    : undefined

  // Render arrow for non-icon, non-link buttons when animation is enabled
  const showArrow = animated && size !== "icon" && variant !== "link"

  if (asChild) {
    // Pass through exactly one child without wrapping; apply classes conditionally
    return (
      <Comp data-slot="button" className={cn(baseClasses, ctaClasses)} {...props}>
        {children}
      </Comp>
    )
  }

  return (
    <Comp data-slot="button" className={cn(baseClasses, ctaClasses)} {...props}>
      <span className={cn("inline-flex items-center", animated && "[transform:skewX(12deg)]")}>{children}</span>
      {showArrow && (
        <span className="relative hidden sm:inline-block ml-3 top-[1px] [transform:skewX(12deg)] transition-all duration-500 will-change-transform group-hover:mr-3">
          <svg width="42" height="18" viewBox="0 0 66 43" xmlns="http://www.w3.org/2000/svg" className="block">
            <g id="arrow" fill="none" fillRule="evenodd">
              <path className="one" d="M40.154 3.895L43.976.139a.5.5 0 01.701 0l21.014 20.646a.999.999 0 010 1.423L44.677 42.861a.5.5 0 01-.701 0l-3.822-3.754a.5.5 0 01-.006-.707L56.994 21.857a.5.5 0 00-.006-.707L40.155 4.608a.5.5 0 01-.006-.713z" fill="currentColor" opacity="0.9" />
              <path className="two" d="M20.154 3.895L23.976.139a.5.5 0 01.701 0l21.015 20.646a.999.999 0 010 1.423L24.677 42.861a.5.5 0 01-.701 0l-3.822-3.754a.5.5 0 01-.006-.707l16.84-16.537a.5.5 0 00-.006-.707L20.155 4.608a.5.5 0 01-.001-.713z" fill="currentColor" opacity="0.7" />
              <path className="three" d="M.154 3.895L3.976.139a.5.5 0 01.701 0l21.015 20.646a.999.999 0 010 1.423L4.677 42.861a.5.5 0 01-.701 0L.154 39.107a.5.5 0 01-.006-.707L16.994 21.857a.5.5 0 00-.006-.707L.155 4.608a.5.5 0 01-.001-.713z" fill="currentColor" opacity="0.5" />
            </g>
          </svg>
        </span>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
