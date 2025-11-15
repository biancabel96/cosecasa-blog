import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isAdminRoute = createRouteMatcher(["/admin(.*)"])

export default clerkMiddleware(async (auth, request) => {
  if (isAdminRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: `${request.nextUrl.origin}/sign-in`,
      unauthorizedUrl: `${request.nextUrl.origin}/`,
    })
  }
})

export const config = {
  matcher: ["/admin/:path*"],
}
