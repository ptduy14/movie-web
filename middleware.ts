import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    if (request.cookies.has('accessToken')) {
        return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/', request.url))
}
 
// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/movies/collection', '/movies/recent'],
  }