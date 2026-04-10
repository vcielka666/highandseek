'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Locale, translations } from '@/lib/i18n/translations'

interface LanguageStore {
  locale: Locale
  t: (typeof translations)[Locale]
  hydrated: boolean
  setLocale: (locale: Locale) => void
}

const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      locale: 'en',
      t: translations['en'],
      hydrated: false,
      setLocale: (locale) => set({ locale, t: translations[locale] }),
    }),
    {
      name: 'hs-language',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.locale]
          state.hydrated = true
        }
      },
    }
  )
)

/** Always returns English until the store is rehydrated from localStorage.
 *  This ensures server HTML matches initial client render (no hydration mismatch). */
export function useLanguage() {
  const { locale, t, hydrated, setLocale } = useLanguageStore()
  return {
    locale: hydrated ? locale : 'en' as Locale,
    t: hydrated ? t : translations['en'],
    setLocale,
  }
}
