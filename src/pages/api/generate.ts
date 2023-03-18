import type { APIRoute } from 'astro'
import { generatePayload, parseOpenAIStream } from '@/utils/openAI'
import { verifySignature, cryptPasswrod } from '@/utils/auth'
// #vercel-disable-blocks
import { fetch, ProxyAgent } from 'undici'
// #vercel-end
import {
  isShareLinkQuotaReachedForGenerate
} from '@/utils/share'

const apiKey = import.meta.env.OPENAI_API_KEY
const httpsProxy = import.meta.env.HTTPS_PROXY
const baseUrl = (import.meta.env.OPENAI_API_BASE_URL || 'https://api.openai.com').trim().replace(/\/$/, '')
const sitePassword = import.meta.env.SITE_PASSWORD

export const post: APIRoute = async (context) => {
  const body = await context.request.json()
  const { sign, time, messages, pass, share_link_id } = body
  if (!messages) {
    return new Response('No input text')
  }
  let isPassValidateSuccess = false;
  if (sitePassword) {
    if (pass) {
      const realPass = await cryptPasswrod(sitePassword)
      if (realPass !== pass) {
        return new Response('Invalid password')
      }
      isPassValidateSuccess = true;
    }
  } else {
    isPassValidateSuccess = true;
  }
  let isShareLinkValidateSuccess = false;
  if (share_link_id && !isPassValidateSuccess) {
    if (await isShareLinkQuotaReachedForGenerate(share_link_id)) {
      return new Response('quota limited')
    }
    isShareLinkValidateSuccess = true;
  }
  if (!(isShareLinkValidateSuccess || isPassValidateSuccess)) {
    return new Response('Invalid auth')
  }
  if (import.meta.env.PROD && !await verifySignature({ t: time, m: messages?.[messages.length - 1]?.content || '', }, sign)) {
    return new Response('Invalid signature')
  }
  const initOptions = generatePayload(apiKey, messages)
  // #vercel-disable-blocks
  if (httpsProxy) {
    initOptions['dispatcher'] = new ProxyAgent(httpsProxy)
  }
  // #vercel-end

  // @ts-ignore
  const response = await fetch(`${baseUrl}/v1/chat/completions`, initOptions) as Response

  return new Response(parseOpenAIStream(response))
}
