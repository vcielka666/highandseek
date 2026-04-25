import { NextRequest } from 'next/server'
import { handleRedirect } from '../route'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return handleRedirect(req, slug)
}
