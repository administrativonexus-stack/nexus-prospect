import { useEffect, useRef, useState } from "react"

// Smooth ease-out cubic count-up; only fires once per mount
export function useCountUp(target: number | null, duration = 850) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (target === null || started.current) return
    started.current = true

    if (target === 0) {
      setCount(0)
      return
    }

    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return count
}
