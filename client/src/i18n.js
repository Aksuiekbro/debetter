import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  // load translation using http -> see /public/locales
  // learn more: https://github.com/i18next/i18next-http-backend
  .use(HttpApi)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    supportedLngs: ['en', 'ru', 'kz'],
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development', // Enable debug logging in development
    detection: {
      // order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'], // cache user language selection
    },
    backend: {
      // path where resources get loaded from
      loadPath: '/locales/{{lng}}/translation.json',
    },
    react: {
      useSuspense: true, // Recommended for loading translations
    },
  });

export default i18n;