import { useEffect, useRef } from 'react'

export function Celebration({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    const colors = ['#0d9488', '#e7b84f', '#c75c4e']
    const pieces = Array.from({ length: 42 }, (_, index) => ({
      x: canvas.width * (0.25 + Math.random() * 0.5), y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 2.5, vy: 2 + Math.random() * 2.5,
      size: 5 + Math.random() * 5, color: colors[index % colors.length]!, rotation: Math.random() * Math.PI,
    }))
    const startedAt = performance.now()
    let frame = 0
    const draw = (now: number) => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach((piece) => {
        piece.x += piece.vx; piece.y += piece.vy; piece.vy += 0.025; piece.rotation += 0.04
        context.save(); context.translate(piece.x, piece.y); context.rotate(piece.rotation); context.fillStyle = piece.color
        context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.65); context.restore()
      })
      if (now - startedAt < 1400) frame = requestAnimationFrame(draw)
      else context.clearRect(0, 0, canvas.width, canvas.height)
    }
    frame = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [active])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" aria-hidden="true" />
}
