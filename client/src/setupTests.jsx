// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize i18next for tests
i18n
  .use(initReactI18next)
  .init({
    lng: 'en', // default language
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    resources: {
      en: {
        translation: {}, // Add mock translations if needed
      },
    },
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    ...originalModule,
    useLocation: jest.fn().mockReturnValue({
      pathname: '/mock-path',
      search: '',
      hash: '',
      state: null,
      key: 'testKey',
    }),
    useNavigate: jest.fn().mockReturnValue(jest.fn()),
    useParams: jest.fn().mockReturnValue({}),
    Link: ({ children, to }) => <a href={to}>{children}</a>, // Basic Link mock
  };
});