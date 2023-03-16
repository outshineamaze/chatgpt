import type { APIRoute } from 'astro'
import { cryptPasswrod } from '@/utils/auth'
const realPassword = import.meta.env.SITE_PASSWORD


export const post: APIRoute = async (context) => {
  const body = await context.request.json()
  const realPasswordHash = await cryptPasswrod(realPassword)
  const { pass } = body
  return new Response(JSON.stringify({
    code: (!realPassword || pass === realPasswordHash) ? 0 : -1,
  }))
}
