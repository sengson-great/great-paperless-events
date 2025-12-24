import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    const { sessionClaims, userId } = await auth();
    
    //Debug logging
    console.log('=== MIDDLEWARE DEBUG ===');
    console.log('URL:', req.url);
    console.log('User ID:', userId);
    console.log('Session Claims:', JSON.stringify(sessionClaims, null, 2));
    console.log('Role:', sessionClaims?.metadata?.role);
    console.log('Is Admin Route:', isAdminRoute(req));
    console.log('======================');
    
    const isAdmin = sessionClaims?.metadata?.role === "admin";
    
    if (isAdminRoute(req) && !isAdmin) {
        console.log('BLOCKED: Not admin, redirecting to home');
        return NextResponse.redirect(new URL("/", req.url));
    }
    
    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};