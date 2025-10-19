"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { typography } from "@/lib/design-system"

type TitleLevel = "h1" | "h2" | "h3" | "h4" | "h5"
type TitleVariant = "default" | "card"
type TitleColor = "default" | "brand" | "muted" | "inverted"

export interface TitleProps {
  as?: TitleLevel
  text?: string
  align?: "left" | "center" | "right"
  color?: TitleColor
  margin?: "none" | "sm" | "md" | "lg" | "xl"
  variant?: TitleVariant
  className?: string
  children?: React.ReactNode
}

const levelToClassDefault: Record<TitleLevel, string> = {
  h1: typography.display,
  h2: typography.hero,
  h3: typography.sectionTitle,
  h4: typography.cardTitle,
  h5: typography.subheading,
}

const levelToClassCard: Record<TitleLevel, string> = {
  h1: typography.cardTitle,
  h2: typography.cardTitle,
  h3: typography.cardTitle,
  h4: typography.subheading,
  h5: typography.subheading,
}

const defaultMarginForLevel: Record<TitleLevel, string> = {
  h1: "mb-8",
  h2: "mb-6",
  h3: "mb-5",
  h4: "mb-4",
  h5: "mb-3",
}

const marginMap: Record<NonNullable<TitleProps["margin"]>, string> = {
  none: "mb-0",
  sm: "mb-3",
  md: "mb-6",
  lg: "mb-8",
  xl: "mb-12",
}

const colorMap: Record<TitleColor, string> = {
  default: "text-brand-primary",
  brand: "text-brand-primary",
  muted: "text-muted-foreground",
  inverted: "text-brand-primary-foreground",
}

export function Title({
  as = "h1",
  text,
  align = "left",
  color = "default",
  margin,
  variant = "default",
  className,
  children,
}: TitleProps) {
  const Tag = as
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
  const marginClass = margin ? marginMap[margin] : defaultMarginForLevel[as]
  const levelClass = variant === "card" ? levelToClassCard[as] : levelToClassDefault[as]

  return (
    <Tag className={cn(levelClass, colorMap[color], alignClass, marginClass, className)}>
      {children ?? text}
    </Tag>
  )
}
