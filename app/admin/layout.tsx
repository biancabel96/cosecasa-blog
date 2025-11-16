import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { ClerkProvider } from "@clerk/nextjs"
import { currentUser } from "@clerk/nextjs/server"

import { AdminLogoutButton } from "./admin-logout-button"
import { PendingChangesProvider } from "./pending-changes-context"

export const dynamic = "force-dynamic"

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set")
  }

  const user = await currentUser()

  if (!user) {
    redirect("/sign-in?redirect_url=/admin")
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <PendingChangesProvider>
        <div className="fixed right-6 top-4 z-50">
          <AdminLogoutButton />
        </div>
        {children}
      </PendingChangesProvider>
    </ClerkProvider>
  )
}
