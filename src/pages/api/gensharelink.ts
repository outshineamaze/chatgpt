import type { APIRoute } from 'astro'
import { cryptPasswrod } from '@/utils/auth'
import {
  generateShareLink,
} from '@/utils/share'

const realPassword = import.meta.env.SITE_PASSWORD

export const post: APIRoute = async (context) => {
  const body = await context.request.json()
  const realPasswordHash = await cryptPasswrod(realPassword)
    const { pass } = body
    const auth = (!realPassword || pass === realPasswordHash)
    if (auth) {
      const sharLink = await generateShareLink(5, context.url.host)
      return new Response(JSON.stringify({
        code: 0,
        sharelink: sharLink,
      }))
    }
  return new Response(JSON.stringify({
    code:  -1,
  }))
}
