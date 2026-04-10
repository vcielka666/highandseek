import { cookies } from 'next/headers'
import { type Locale, translations } from './translations'

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies()
  const raw = store.get('hs-locale')?.value
  return raw === 'cs' ? 'cs' : 'en'
}

export async function getServerT() {
  const locale = await getServerLocale()
  return { locale, t: translations[locale] }
}
