import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LANGUAGE_CODES } from '../i18n/i18n';

// Thin wrapper over react-i18next's own instance — mirrors useTheme()'s
// { theme, setTheme, themes } shape ({ language, setLanguage, languages })
// for a Language switcher UI, while every component that actually renders
// translated text uses react-i18next's own useTranslation()/t() directly
// (the standard, well-tested pattern) rather than a second parallel
// abstraction. i18n.changeLanguage() already notifies every useTranslation()
// subscriber and triggers a re-render — no extra state/context needed here.
export function useLanguage() {
  const { i18n } = useTranslation();

  const setLanguage = useCallback((code) => {
    if (LANGUAGE_CODES.includes(code)) i18n.changeLanguage(code);
  }, [i18n]);

  return { language: i18n.language, setLanguage, languages: LANGUAGES };
}
