import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm font-semibold " +
  "transition-[background-color,border-color,color,transform,box-shadow] duration-instant ease-standard " +
  "disabled:pointer-events-none disabled:opacity-55 active:scale-[0.985]";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-soft hover:bg-brand-deep hover:-translate-y-px",
  secondary:
    "border border-line bg-surface text-ink hover:border-line-strong hover:bg-paper-deep/50",
  ghost: "text-ink-soft hover:bg-paper-deep/70 hover:text-ink",
  outline: "border border-brand/30 bg-transparent text-brand hover:border-brand hover:bg-brand-soft/50",
  danger: "bg-accent-danger text-white hover:bg-[#99201a]",
  link: "h-auto rounded-none p-0 text-brand underline-offset-4 hover:underline"
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-body-sm",
  md: "h-11 px-5 text-body-sm",
  lg: "h-12 px-6 text-body"
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { href?: undefined };
type ButtonAsLink = CommonProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & { href: string };

/**
 * KUTUBI Button — single source for every clickable primary/secondary action.
 * hover = color + 1px lift (primary only). No scale. See VISUAL_SYSTEM.md §9.
 */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", loading = false, className, children, ...rest } = props;
  const classes = cn(base, variantClasses[variant], variant === "link" ? "" : sizeClasses[size], className);

  const content = (
    <>
      {loading ? (
        <span className="grid size-4 place-items-center" aria-hidden="true">
          <LoaderCircle size={16} className="animate-spin" />
        </span>
      ) : null}
      {children}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...linkRest } = rest as React.ComponentProps<typeof Link>;
    return (
      <Link href={href} className={classes} aria-busy={loading || undefined} {...linkRest}>
        {content}
      </Link>
    );
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={buttonProps.type ?? "button"} aria-busy={loading || undefined} className={classes} {...buttonProps}>
      {content}
    </button>
  );
}

export type { Variant, Size };
