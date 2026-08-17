"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const colors = [
  "#000000", "#171717", "#262626", "#404040", "#525252",
  "#737373", "#a3a3a3", "#d4d4d4", "#e5e5e5", "#fafafa",
]

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

type Particle = {
  id: number
  color: string
  rotation: number
  shape: "square" | "circle"
  w: number
  h: number
  delay: number
  fromX: number
  fromY: number
  toX: number
  toY: number
}

export function Confetti({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (trigger === 0) return
    const w = typeof window !== "undefined" ? window.innerWidth : 1200
    const h = typeof window !== "undefined" ? window.innerHeight : 800
    const newParticles: Particle[] = []
    for (let i = 0; i < 800; i++) {
      const isLeft = i % 2 === 0
      const fromX = isLeft ? randomBetween(-30, 0) : randomBetween(w - 10, w + 30)
      const fromY = h + randomBetween(20, 80)
      const toX = isLeft
        ? randomBetween(w * 0.05, w * 0.5)
        : randomBetween(w * 0.5, w * 0.95)
      const toY = randomBetween(h * 0.05, h * 0.6)
      newParticles.push({
        id: trigger * 1000 + i,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: randomBetween(0, 720),
        shape: Math.random() > 0.5 ? "square" : "circle",
        w: randomBetween(5, 10),
        h: randomBetween(5, 10),
        delay: Math.random() * 0.6,
        fromX,
        fromY,
        toX,
        toY,
      })
    }
    setParticles(newParticles)
    const timer = setTimeout(() => setParticles([]), 3000)
    return () => clearTimeout(timer)
  }, [trigger])

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.fromX, y: p.fromY, rotate: 0, opacity: 1 }}
          animate={{
            x: p.toX,
            y: p.toY,
            rotate: p.rotation,
            opacity: [1, 1, 0.8, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 2.5,
            delay: p.delay,
            ease: [0.25, 0.1, 0.25, 1],
            times: [0, 0.2, 0.6, 1],
          }}
          className={`fixed top-0 left-0 z-[110] ${
            p.shape === "circle" ? "rounded-full" : "rounded-sm"
          }`}
          style={{
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
          }}
        />
      ))}
    </AnimatePresence>
  )
}
