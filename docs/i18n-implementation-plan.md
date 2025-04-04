# Plan: Implementing Internationalization (i18n) in React Frontend

**Objective:** Add support for Kazakh (kz), Russian (ru), and English (en) languages to the React application.

**1. Library Choice:**

*   **Recommendation:** `i18next` combined with `react-i18next`.
*   **Justification:** This is the de-facto standard for i18n in React. It's mature, flexible, well-documented, and has excellent community support. It integrates seamlessly with React components and hooks, supports various backends for loading translations (e.g., loading from files, APIs), and includes features like plurals, context, and interpolation.

**2. File Structure:**

*   **Proposed Structure:** Store translation files in a dedicated `locales` directory within the client source.
    ```
    client/
    └── src/
        ├── locales/
        │   ├── en/
        │   │   └── translation.json
        │   ├── ru/
        │   │   └── translation.json
        │   └── kz/
        │       └── translation.json
        ├── components/
        ├── hooks/
        ├── ...
        └── i18n.js  <-- Configuration file
        └── index.js <-- App entry point
        └── App.js
    ```
*   **`translation.json` Format:** Standard JSON key-value pairs.
    *   Example (`en/translation.json`):
        ```json
        {
          "welcomeMessage": "Welcome to our application!",
          "navbar": {
            "home": "Home",
            "tournaments": "Tournaments"
          }
        }
        ```

**3. Configuration (`client/src/i18n.js`):**

*   **Key Elements:**
    *   **Imports:** Import `i18next`, `initReactI18next` (to bind i18next with React), `HttpBackend` (to load translations over HTTP), and `LanguageDetector` (to detect user language).
    *   **Initialization (`i18n.use(...).init(...)`):**
        *   Chain the necessary plugins: `HttpBackend`, `LanguageDetector`, `initReactI18next`.
        *   Call `.init()` with configuration options:
            *   `supportedLngs: ['en', 'ru', 'kz']`: Define the languages your app supports.
            *   `fallbackLng: 'en'`: Specify the language to use if the detected language is unavailable or detection fails.
            *   `backend.loadPath: '/locales/{{lng}}/translation.json'`: Define the path template to load translation files. Ensure these files are served correctly (e.g., placed in the `public` folder or handled by the build process).
            *   `detection`: Configure language detection options.
                *   `order: ['localStorage', 'navigator', 'htmlTag']`: Define the order of detection methods (check localStorage first, then browser language).
                *   `caches: ['localStorage']`: Cache the detected language in localStorage.
            *   `interpolation: { escapeValue: false }`: Necessary for React as it already handles XSS escaping.
            *   `debug: process.env.NODE_ENV === 'development'`: Enable debug logging in development.

**4. App Integration (`client/src/index.js`):**

*   **Import Configuration:** Import the `client/src/i18n.js` file in your main application entry point (`client/src/index.js`). This ensures the i18n instance is configured before your app renders.
*   **Suspense:** Wrap your main `<App />` component with React's `<Suspense>` component. This handles the loading state while translations are being fetched asynchronously.
    ```javascript
    // client/src/index.js
    import React, { Suspense } from 'react';
    import ReactDOM from 'react-dom/client';
    import App from './App';
    import './i18n'; // Import the i18n configuration

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <Suspense fallback="Loading..."> {/* Or a proper loading spinner */}
          <App />
        </Suspense>
      </React.StrictMode>
    );
    ```

**5. Switcher Placement:**

*   **Recommendation:** The `client/src/components/Navbar.js` component is a common and suitable location for a global language switcher UI element (e.g., a dropdown or set of buttons). This allows users to change the language from anywhere in the application.

**6. Component Refactoring Strategy:**

*   **Hook Usage:** Use the `useTranslation` hook from `react-i18next` within functional components.
    ```javascript
    import { useTranslation } from 'react-i18next';

    function MyComponent() {
      const { t, i18n } = useTranslation();

      const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
      };

      return (
        <div>
          <h1>{t('welcomeMessage')}</h1>
          <button onClick={() => changeLanguage('en')}>English</button>
          <button onClick={() => changeLanguage('ru')}>Русский</button>
          <button onClick={() => changeLanguage('kz')}>Қазақша</button>
        </div>
      );
    }
    ```
*   **Text Replacement:** Replace hardcoded strings with the `t()` function, using keys defined in your `translation.json` files (e.g., `t('navbar.home')`).
*   **Iterative Approach:** Refactor components gradually, starting with shared components like the Navbar and then moving to specific views/pages.

**Next Steps:**

1.  Review this plan.
2.  Confirm if this plan aligns with your requirements.
3.  Decide if you want this plan saved to a Markdown file.
4.  Proceed to implementation (likely in 'code' mode).