"use client"

import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <ClerkLoading>
        <div className="text-sm text-muted-foreground">Caricamento del modulo di accesso…</div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn path="/sign-in" routing="path" afterSignInUrl="/admin" afterSignUpUrl="/admin" />
      </ClerkLoaded>
    </div>
  )
}
