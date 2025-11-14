"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center cursor-pointer">
            <Image
              src="/logo-full.png"
              alt="Cosecase"
              width={1847}
              height={409}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
