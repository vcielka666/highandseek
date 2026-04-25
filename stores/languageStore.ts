'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Locale, translations } from '@/lib/i18n/translations'

function setLocaleCookie(locale: Locale) {
  if (typeof document !== 'undefined') {
    document.cookie = `hs-locale=${locale};path=/;max-age=31536000;SameSite=Lax`
  }
}

interface LanguageStore {
  locale: Locale
  t: (typeof translations)[Locale]
  hydrated: boolean
  setLocale: (locale: Locale) => void
}

const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      locale: 'cs',
      t: translations['cs'],
      hydrated: false,
      setLocale: (locale) => {
        setLocaleCookie(locale)
        set({ locale, t: translations[locale] })
      },
    }),
    {
      name: 'hs-language',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.locale]
          state.hydrated = true
          setLocaleCookie(state.locale) // sync cookie with existing localStorage value
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
    locale: hydrated ? locale : 'cs' as Locale,
    t: hydrated ? t : translations['cs'],
    setLocale,
  }
}
