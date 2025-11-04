import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import translationEN from './locales/en/translation.json'
import translationRU from './locales/ru/translation.json'
import translationUZ from './locales/uz/translation.json'

const resources = {
	uz: {
		translation: translationUZ,
	},
	en: {
		translation: translationEN,
	},
	ru: {
		translation: translationRU,
	},
}

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: 'uz',
		debug: false,
		interpolation: {
			escapeValue: false,
		},
		detection: {
			order: ['localStorage', 'navigator'],
			caches: ['localStorage'],
		},
	})

export default i18n
