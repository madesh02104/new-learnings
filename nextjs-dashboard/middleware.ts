import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  // Example middleware logic
  console.log('Middleware executed for:', request.url);
  return NextResponse.next();
}