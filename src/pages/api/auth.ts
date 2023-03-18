import type { APIRoute } from 'astro'
import { cryptPasswrod } from '@/utils/auth'
import {
  isShareLinkQuotaReached
} from '@/utils/share'
const realPassword = import.meta.env.SITE_PASSWORD


export const post: APIRoute = async (context) => {
  const body = await context.request.json()
  const { pass, share_link_id, share_link_id_from_url } = body
  if (share_link_id_from_url) {
    const isLinkValidateFail = await isShareLinkQuotaReached(share_link_id_from_url)
    return new Response(JSON.stringify({
      code: isLinkValidateFail ? -1: 0,
    }))
  }
  if (pass) {
    const realPasswordHash = await cryptPasswrod(realPassword)
    return new Response(JSON.stringify({
      code: (!realPassword || pass === realPasswordHash) ? 0 : -1,
    }))
  }
  if (share_link_id ) {
    const isLinkValidateFail = await isShareLinkQuotaReached(share_link_id)
    return new Response(JSON.stringify({
      code: isLinkValidateFail ? -1 : 0,
    }))
  }
  return new Response(JSON.stringify({
    code: -1,
  }))
}
