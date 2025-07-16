// middleware.ts - TEMPORAIREMENT DÉSACTIVÉ POUR DEBUG
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // MIDDLEWARE DÉSACTIVÉ - LAISSER PASSER TOUTES LES REQUÊTES
  console.log(`🔍 MIDDLEWARE DÉSACTIVÉ: ${req.nextUrl.pathname} - PASSAGE AUTORISÉ`)
  
  return NextResponse.next()
}

export const config = {
  matcher: []  // Matcher vide = middleware désactivé
}
