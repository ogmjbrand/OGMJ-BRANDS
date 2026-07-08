"use client"

import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { motion } from "framer-motion"

type FadeUpProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}

export function FadeUp({ children, className, delay = 0, y = 24 }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

type MIconProps = {
  name: string
  size?: number
  fill?: number
  weight?: number
  grade?: number
  opticalSize?: number
}

export function MIcon({
  name,
  size = 20,
  fill = 0,
  weight = 400,
  grade = 0,
  opticalSize = size,
}: MIconProps) {
  return (
    <span
      className="material-symbols-outlined inline-flex select-none items-center justify-center leading-none"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
      }}
      aria-hidden
    >
      {name}
    </span>
  )
}

type PrimaryButtonProps =
  | ({ as?: "button"; children: ReactNode } & ComponentPropsWithoutRef<"button">)
  | ({ as: "a"; children: ReactNode } & ComponentPropsWithoutRef<"a">)

export function PrimaryButton(props: PrimaryButtonProps) {
  const baseClassName =
    "group inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-[#D4AF37] px-9 text-sm font-medium leading-none text-black transition-colors hover:bg-[#e0c04a]"

  if (props.as === "a") {
    const { as, children, className, ...anchorProps } = props

    return (
      <a className={`${baseClassName} ${className ?? ""}`} {...anchorProps}>
        <AnimatedText>{children}</AnimatedText>
      </a>
    )
  }

  const { as, children, className, ...buttonProps } = props

  return (
    <button className={`${baseClassName} ${className ?? ""}`} {...buttonProps}>
      <AnimatedText>{children}</AnimatedText>
    </button>
  )
}

function AnimatedText({ children }: { children: ReactNode }) {
  return (
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-200 ease-out group-hover:-translate-y-full">
        {children}
      </span>
      <span className="absolute inset-0 block translate-y-full transition-transform duration-200 ease-out group-hover:translate-y-0">
        {children}
      </span>
    </span>
  )
}

