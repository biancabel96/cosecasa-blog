import type { ReactNode } from "react"
import { ClerkProvider } from "@clerk/nextjs"

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set")
  }

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
}
