"use client"

import { SignOutButton } from "@clerk/nextjs"

export function AdminLogoutButton() {
  return (
    <SignOutButton redirectUrl="/">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
      >
        Esci
      </button>
    </SignOutButton>
  )
}
