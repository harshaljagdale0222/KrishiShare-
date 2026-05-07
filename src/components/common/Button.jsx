import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}) {
  const base = 'flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white',
    outline:   'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    danger:    'bg-red-500 hover:bg-red-600 text-white',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  )
}