import type { InitOptions } from 'i18next'

export const i18nConfig: InitOptions = {
  defaultNS: 'common',
  fallbackLng: 'bn',
  supportedLngs: ['bn', 'en'],
  nonExplicitSupportedLngs: true,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
}
