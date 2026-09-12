'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

/*
 * Primitives d'interface. Volontairement reduites : ce produit n'a que
 * six ecrans, une bibliotheque complete serait du poids mort. Toutes les
 * couleurs viennent des jetons de globals.css.
 */

// ── Button ────────────────────────────────────────────────────────────

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-ink hover:bg-accent-hover',
        secondary:
          'bg-surface-raised text-text border border-border hover:border-border-strong',
        ghost: 'text-text-muted hover:text-text hover:bg-surface-raised',
        danger: 'bg-danger text-white hover:opacity-90',
        record: 'bg-record text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

// ── Input / Label ─────────────────────────────────────────────────────

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-surface-sunken px-3 text-sm',
        'placeholder:text-text-faint focus:border-accent focus:outline-none',
        className,
      )}
      {...props}
    />
  );
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-sm font-medium text-text-muted', className)}
      {...props}
    />
  );
}

// ── Card ──────────────────────────────────────────────────────────────

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface p-4',
        className,
      )}
      {...props}
    />
  );
}

// ── Badge ─────────────────────────────────────────────────────────────

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-raised text-text-muted',
        ok: 'bg-ok/15 text-ok',
        warn: 'bg-warn/15 text-warn',
        danger: 'bg-danger/15 text-danger',
        accent: 'bg-accent/15 text-accent',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

// ── Alert ─────────────────────────────────────────────────────────────

export function Alert({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: 'neutral' | 'warn' | 'danger' | 'ok';
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    neutral: 'border-border bg-surface-raised text-text-muted',
    warn: 'border-warn/40 bg-warn/10 text-warn',
    danger: 'border-danger/40 bg-danger/10 text-danger',
    ok: 'border-ok/40 bg-ok/10 text-ok',
  } as const;
  return (
    <div
      role="status"
      className={cn('rounded-lg border px-3 py-2 text-sm', tones[tone], className)}
    >
      {children}
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────────────

export function Progress({
  value,
  indeterminate,
  className,
}: {
  value: number;
  indeterminate?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-surface-sunken',
        className,
      )}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full bg-accent transition-[width] duration-500',
          indeterminate && 'w-1/3 animate-pulse',
        )}
        style={indeterminate ? undefined : { width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('h-4 w-4 animate-spin text-text-faint', className)} />
  );
}

// ── Dialog ────────────────────────────────────────────────────────────
// Un <dialog> natif suffit : pas de portail, pas de focus trap maison.

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-card border border-border bg-surface p-0 text-text backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-text-faint hover:text-text"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-4 py-4 text-sm text-text-muted">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
