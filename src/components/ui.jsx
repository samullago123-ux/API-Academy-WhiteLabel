import { cn } from '../utils/cn'

export function Container({ className, ...props }) {
  return <div className={cn('mx-auto w-full max-w-5xl px-4', className)} {...props} />
}

export function Card({ className, ...props }) {
  return <div className={cn('rounded-2xl border border-zinc-800 bg-zinc-950/40', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex items-start gap-3 border-b border-zinc-800 px-6 py-5', className)} {...props} />
}

export function CardBody({ className, ...props }) {
  return <div className={cn('px-6 py-6', className)} {...props} />
}

export function Badge({ className, color = 'indigo', ...props }) {
  const tones = {
    indigo: 'bg-indigo-500/15 text-indigo-400',
    amber: 'bg-amber-500/15 text-amber-400',
    red: 'bg-red-500/15 text-red-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    zinc: 'bg-zinc-500/15 text-zinc-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-[10px] font-extrabold tracking-widest',
        tones[color] ?? tones.zinc,
        className,
      )}
      {...props}
    />
  )
}

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
  const variants = {
    primary:
      'bg-indigo-500 text-white hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-500',
    secondary:
      'bg-zinc-900 text-zinc-200 hover:bg-zinc-800 disabled:bg-zinc-950 disabled:text-zinc-600',
    ghost:
      'bg-transparent text-zinc-200 hover:bg-zinc-900 disabled:text-zinc-600 disabled:hover:bg-transparent',
  }
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-base',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 disabled:cursor-not-allowed',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        className,
      )}
      {...props}
    />
  )
}

export function ProgressBar({ value, className, barClassName }) {
  const clamped = Math.max(0, Math.min(100, value ?? 0))
  return (
    <progress
      max={100}
      value={clamped}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-zinc-800 accent-indigo-500', barClassName, className)}
    />
  )
}

export function Tabs({ value, onValueChange, items, className }) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto pb-1', className)}>
      {items.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            onClick={() => onValueChange(t.value)}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
              active ? 'bg-zinc-900 text-zinc-100 ring-1 ring-indigo-500/60' : 'text-zinc-400 hover:bg-zinc-900',
            )}
          >
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function CodeBlock({ className, ...props }) {
  return (
    <pre
      className={cn(
        'overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-relaxed text-zinc-300',
        className,
      )}
      {...props}
    />
  )
}

