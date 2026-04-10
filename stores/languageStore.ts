'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Locale, translations } from '@/lib/i18n/translations'

interface LanguageStore {
  locale: Locale
  t: (typeof translations)[Locale]
  setLocale: (locale: Locale) => void
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      locale: 'en',
      t: translations['en'],
      setLocale: (locale) => set({ locale, t: translations[locale] }),
    }),
    { name: 'hs-language' }
  )
)
