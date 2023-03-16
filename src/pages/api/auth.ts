import type { APIRoute } from 'astro'
import { cryptPasswrod } from '@/utils/auth'
const realPassword = import.meta.env.SITE_PASSWORD


export const post: APIRoute = async (context) => {
  const body = await context.request.json()

  const { pass } = body
  return new Response(JSON.stringify({
    code: (!realPassword || pass === cryptPasswrod(realPassword)) ? 0 : -1,
  }))
}
