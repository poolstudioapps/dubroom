'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, Loader2, X } from 'lucide-react';
import * as React from 'react';

import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/*
 * Primitives d'interface.
 *
 * Chacune porte une classe d'accroche — `btn-3d`, `ui-input`,
 * `ui-dialog`… — et c'est la feuille de style qui y dessine le verre,
 * l'or et les mouvements de la salle. Les classes posees ici ne disent
 * que la structure et la couleur de base : un ecran n'a jamais a
 * combattre un style qu'il ne voit pas.
 */

// ── Button ────────────────────────────────────────────────────────────

const buttonVariants = cva(
  'btn-3d inline-flex items-center justify-center gap-2 font-semibold select-none disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50',
  {
    variants: {
      // Chaque variante porte son nom en classe : c'est par la que la
      // feuille de style la dessine, sans deviner la variante depuis ses
      // utilitaires.
      variant: {
        primary: 'btn-primary bg-accent text-accent-ink',
        secondary: 'btn-secondary text-text',
        ghost: 'btn-ghost bg-transparent text-text-muted hover:text-text',
        danger: 'btn-danger bg-danger text-white hover:brightness-110',
        record: 'btn-record bg-record text-white hover:brightness-110',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
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
        'ui-input h-10 w-full px-3 text-sm text-text placeholder:text-text-faint focus:outline-none',
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
      className={cn('block text-sm font-bold text-text-muted', className)}
      {...props}
    />
  );
}

/**
 * Liste deroulante native.
 *
 * Pour les rares endroits ou la roulette du telephone vaut mieux qu'un
 * menu dessine ; partout ailleurs, `SelectMenu`.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'ui-select h-10 w-full min-w-0 px-3 text-sm font-bold outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

// ── Card ──────────────────────────────────────────────────────────────

/**
 * Une surface : un panneau de verre, ou rien du tout quand le conteneur
 * en fournit deja un.
 */
export function Card({
  className,
  variant = 'panel',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'panel' | 'bare';
}) {
  return <div className={cn(variant === 'panel' && 'panel p-4', className)} {...props} />;
}

// ── Badge ─────────────────────────────────────────────────────────────

const badgeVariants = cva(
  'ui-badge inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      // Chaque ton a son encre claire (`*-ink`) : l'aplat plein, pose en
      // texte sur le charbon, tomberait sous la barre de lisibilite.
      tone: {
        neutral: 'border-border-strong bg-surface-raised text-text-muted',
        ok: 'border-ok/40 bg-ok/15 text-ok-ink',
        warn: 'border-warn/40 bg-warn/15 text-warn-ink',
        danger: 'border-danger/40 bg-danger/15 text-danger-ink',
        accent: 'border-accent/35 bg-accent/15 text-badge-accent-ink',
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
    neutral: 'border-border-strong bg-surface-raised text-text-muted',
    warn: 'border-warn/45 bg-warn/12 text-warn-ink',
    danger: 'border-danger/45 bg-danger/12 text-danger-ink',
    ok: 'border-ok/45 bg-ok/12 text-ok-ink',
  } as const;
  return (
    <div
      role="status"
      className={cn('ui-alert border px-3 py-2 text-sm font-medium', tones[tone], className)}
    >
      {children}
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────────────
// Un fil d'or qui avance.

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
      className={cn('ui-progress w-full overflow-hidden', className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full bg-accent transition-[width] duration-500',
          indeterminate && 'w-1/3 animate-pulse',
        )}
        style={
          indeterminate ? undefined : { width: `${Math.min(100, Math.max(0, value))}%` }
        }
      />
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'ui-toggle relative h-7 w-12 shrink-0 transition-colors disabled:opacity-50',
        checked ? 'bg-accent/45' : 'bg-surface-sunken',
      )}
    >
      <span
        className={cn(
          'ui-toggle-knob absolute top-1 h-5 w-5',
          checked ? 'left-[calc(100%-1.5rem)]' : 'left-1',
        )}
        aria-hidden
      />
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin text-text-faint', className)} />;
}

// ── Dialog ────────────────────────────────────────────────────────────
// Un <dialog> natif, en verre fume sur la salle assombrie.

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
  const t = useT();
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
      className="ui-dialog m-auto w-[min(34rem,calc(100vw-2rem))] text-text"
    >
      <div className="flex max-h-[calc(100dvh-3rem)] flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="titre text-xl text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-faint transition-colors hover:bg-surface-raised hover:text-text"
            aria-label={t.common.close}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-4 text-sm text-text-muted">{children}</div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}

// ── Disclosure ────────────────────────────────────────────────────────
// Un tiroir qu'on ouvre. Ce qui n'est utile qu'une fois de temps en temps
// n'a pas a occuper le haut d'un ecran en permanence.

export function Disclosure({
  title,
  hint,
  icon,
  defaultOpen,
  children,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="panel group [&[open]_.chevron]:rotate-180">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
        {icon ? <span className="shrink-0 text-text-muted">{icon}</span> : null}
        <span className="flex-1">
          {title}
          {hint ? <span className="ml-2 font-medium text-text-faint">{hint}</span> : null}
        </span>
        <ChevronDown
          className="chevron h-4 w-4 shrink-0 text-text-muted transition-transform"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 border-t border-border px-4 pb-4 pt-4">{children}</div>
    </details>
  );
}
