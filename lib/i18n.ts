'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { i18nConfig } from '@/next-i18next.config'

import bn from '@/public/locales/bn/common.json'
import en from '@/public/locales/en/common.json'

i18n.use(initReactI18next).init({
  ...i18nConfig,
  resources: {
    bn: { common: bn },
    en: { common: en },
  },
  lng: 'bn',
})

export default i18n
