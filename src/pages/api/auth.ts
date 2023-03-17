import type { APIRoute } from 'astro'
import { cryptPasswrod } from '@/utils/auth'
import {
  isShareLinkQuotaReached
} from '@/utils/share'
const realPassword = import.meta.env.SITE_PASSWORD


export const post: APIRoute = async (context) => {
  const body = await context.request.json()
  const { pass, share_link_id } = body
  if (share_link_id ) {
    if (await isShareLinkQuotaReached(share_link_id)) {
      return new Response(JSON.stringify({
        code:  -2,
      }))
    } else {
      return new Response(JSON.stringify({
        code:0,
      }))
    }
  }
  const realPasswordHash = await cryptPasswrod(realPassword)
  return new Response(JSON.stringify({
    code: (!realPassword || pass === realPasswordHash) ? 0 : -1,
  }))
}
