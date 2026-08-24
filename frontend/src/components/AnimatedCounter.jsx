import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

function useAnimatedNumber(target, duration = 800) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    if (target === 0) { setValue(0); return }

    const start = performance.now()
    const from = 0

    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [target, duration, inView])

  return { value, ref }
}

export default function AnimatedCounter({ value, className = '', prefix = '', suffix = '' }) {
  const { value: animated, ref } = useAnimatedNumber(Number(value) || 0)

  return (
    <motion.span
      ref={ref}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      className={className}
    >
      {prefix}{animated.toLocaleString()}{suffix}
    </motion.span>
  )
}
