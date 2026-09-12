'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, Loader2, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

/*
 * Primitives d'interface, habillees en jeu de soiree.
 *
 * L'API exportee est exactement celle d'avant : seuls les styles ont
 * change. Aucun ecran n'a eu besoin d'etre retouche pour cette peau, ce
 * qui est la seule facon serieuse de changer de look sans risquer une
 * fonctionnalite au passage.
 */

// ── Button ────────────────────────────────────────────────────────────
// Une plaque posee sur une levre plus sombre, qui s'enfonce au clic.

const buttonVariants = cva(
  'btn-3d inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wide select-none disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-ink hover:bg-accent-hover [--btn-lip:var(--color-accent-ink)]',
        secondary:
          'bg-surface-raised text-text hover:bg-surface [--btn-lip:var(--color-border-strong)]',
        ghost:
          'bg-transparent text-text-muted shadow-none hover:bg-surface-raised hover:text-text active:translate-y-0 [--btn-lip:transparent]',
        danger: 'bg-danger text-white hover:brightness-110 [--btn-lip:oklch(0.36_0.16_25)]',
        record: 'bg-record text-white hover:brightness-110 [--btn-lip:oklch(0.38_0.17_25)]',
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
// Champ encastre dans la plaque, coins scotches comme sur la console.

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-sm border-2 border-border-strong bg-screen px-3 text-sm text-text',
        'shadow-[inset_0_2px_4px_0_rgb(0_0_0/0.18)]',
        'placeholder:text-text-faint placeholder:italic focus:border-bezel focus:outline-none',
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

/** Libelle du menu : une diode, puis une etiquette en relief. */
export function MenuLabel({
  children,
  on,
  className,
}: {
  children: React.ReactNode;
  on?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span className={cn('led shrink-0', on && 'led-on')} aria-hidden />
      <span className="flex-1 rounded-sm border border-border-strong bg-surface-raised px-3 py-1.5 text-sm font-bold shadow-[inset_0_1px_0_0_rgb(255_255_255/0.6)]">
        {children}
      </span>
    </span>
  );
}

/**
 * Liste deroulante.
 *
 * Le `select` du systeme plutot qu'un menu maison : il sait deja se
 * comporter au clavier, au doigt et au lecteur d'ecran, et sur telephone
 * il ouvre la roulette native, qu'aucun menu dessine a la main n'egale.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full min-w-0 rounded-lg border-2 border-border-strong bg-surface-raised px-3 text-sm font-bold',
        'shadow-[inset_0_2px_3px_0_rgb(0_0_0/0.12)] outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

// ── Card ──────────────────────────────────────────────────────────────
// La plaque metallique vissee aux quatre coins.

/**
 * Une surface.
 *
 * Trois variantes, et le defaut a change : `panel`, sobre, est ce dont on
 * a besoin quatre-vingt-dix pour cent du temps. La plaque vissee est
 * reservee aux panneaux de commande — le studio, les reglages — ou son
 * cote appareil a un sens. Empilee partout, elle encadrait chaque
 * information trois fois.
 */
export function Card({
  className,
  variant = 'panel',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'panel' | 'plate' | 'bare';
}) {
  const surfaces = {
    panel: 'panel p-4',
    plate: 'plate rounded-card p-4',
    bare: '',
  } as const;

  return <div className={cn(surfaces[variant], className)} {...props} />;
}

// ── Badge ─────────────────────────────────────────────────────────────

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
  {
    variants: {
      tone: {
        neutral: 'border-border-strong bg-surface-raised text-text-muted',
        ok: 'border-ok/50 bg-ok/20 text-ok',
        warn: 'border-warn/50 bg-warn/25 text-[oklch(0.45_0.12_75)]',
        danger: 'border-danger/50 bg-danger/20 text-danger',
        accent: 'border-accent-ink/40 bg-accent/35 text-accent-ink',
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
    warn: 'border-warn bg-warn/20 text-[oklch(0.42_0.12_75)]',
    danger: 'border-danger bg-danger/15 text-[oklch(0.42_0.18_25)]',
    ok: 'border-ok bg-ok/15 text-[oklch(0.4_0.13_150)]',
  } as const;
  return (
    <div
      role="status"
      className={cn(
        'rounded-sm border-2 border-dashed px-3 py-2 text-sm font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────────────
// Jauge encastree, remplie par segments comme un vumetre.

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
        'h-4 w-full overflow-hidden rounded-sm border-2 border-border-strong bg-surface-sunken',
        'shadow-[inset_0_2px_4px_0_rgb(0_0_0/0.25)]',
        className,
      )}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full bg-accent transition-[width] duration-500',
          'bg-[repeating-linear-gradient(90deg,var(--color-accent)_0_10px,var(--color-accent-hover)_10px_12px)]',
          indeterminate && 'w-1/3 animate-pulse',
        )}
        style={
          indeterminate
            ? undefined
            : { width: `${Math.min(100, Math.max(0, value))}%` }
        }
      />
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────
// L'interrupteur a bascule du panneau de reglages.

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
        'relative h-7 w-14 shrink-0 rounded-sm border-2 border-border-strong transition-colors',
        'shadow-[inset_0_2px_4px_0_rgb(0_0_0/0.25)] disabled:opacity-50',
        checked ? 'bg-accent/40' : 'bg-surface-sunken',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-6 rounded-sm border border-border-strong bg-surface-raised transition-all',
          'shadow-[0_1px_2px_0_rgb(0_0_0/0.4)]',
          checked ? 'left-[calc(100%-1.6rem)]' : 'left-0.5',
        )}
        aria-hidden
      />
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('h-4 w-4 animate-spin text-text-faint', className)} />
  );
}

// ── Dialog ────────────────────────────────────────────────────────────
// Un <dialog> natif, encadre comme le panneau de menu de la console.

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
      className={cn(
        'm-auto w-[min(34rem,calc(100vw-2rem))] rounded-md p-2 text-text backdrop:bg-room-deep/80',
        'border-[6px] border-[oklch(0.55_0.12_45)] bg-[oklch(0.32_0.03_300)]',
        'shadow-[0_20px_50px_-10px_rgb(0_0_0/0.7)]',
      )}
    >
      <div className="plate rounded-sm">
        <div className="flex items-center justify-between border-b-2 border-border-strong px-4 py-3">
          <h2 className="signage text-lg text-text" style={{ textShadow: 'none' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-faint hover:text-text"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 text-sm text-text-muted">{children}</div>

        {footer ? (
          <div className="flex justify-end gap-2 border-t-2 border-border-strong px-4 py-3">
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
    <details
      open={defaultOpen}
      className="plate group rounded-card [&[open]_.chevron]:rotate-180"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
        {icon ? <span className="shrink-0 text-text-muted">{icon}</span> : null}
        <span className="flex-1">
          {title}
          {hint ? (
            <span className="ml-2 font-medium text-text-faint">{hint}</span>
          ) : null}
        </span>
        <ChevronDown
          className="chevron h-4 w-4 shrink-0 text-text-muted transition-transform"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 border-t-2 border-border px-4 pb-4 pt-4">
        {children}
      </div>
    </details>
  );
}
