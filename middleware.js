import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/transaction(.*)",
]);

// Create Arcjet middleware
const aj = process.env.ARCJET_KEY
  ? arcjet({
      key: process.env.ARCJET_KEY,
      rules: [
        shield({ mode: "DRY_RUN" }),
        detectBot({
          mode: "DRY_RUN",
          allow: ["CATEGORY:SEARCH_ENGINE", "GO_HTTP"],
        }),
      ],
    })
  : null;

// Create base Clerk middleware
const clerk = clerkMiddleware(async (auth, req) => {
  const authData = await auth();

  if (!authData.userId && isProtectedRoute(req)) {
    return authData.redirectToSignIn();
  }

  return NextResponse.next();
});

// Chain middlewares - ArcJet runs first, then Clerk
export default aj ? createMiddleware(aj, clerk) : clerk;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
