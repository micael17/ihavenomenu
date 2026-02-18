import type { H3Event } from 'h3'

export type Locale = 'en' | 'ko'

export function getLocale(event: H3Event): Locale {
  const cookie = getCookie(event, 'i18n_redirected')
  if (cookie === 'ko') return 'ko'
  return 'en'
}
