import { useEffect, useState } from 'react'

/**
 * Celebration — subtle background fade pulse shown on session completion.
 *
 * Replaces the previous confetti animation with a calm, professional
 * visual cue appropriate for a cognitive-support healthcare product.
 */
export function Celebration({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 1200)
    return () => clearTimeout(timer)
  }, [active])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 animate-[celebration-fade_1.2s_ease-out_forwards]"
      aria-hidden="true"
      style={{
        background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
      }}
    />
  )
}
