import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGS, translations } from '../i18n/translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'ph_lang';

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGS.some((l) => l.code === saved) ? saved : 'sq';
  });

  const setLang = useCallback((code) => {
    if (!LANGS.some((l) => l.code === code)) return;
    setLangState(code);
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key, fallback = key) => {
      const value = getNested(translations[lang], key) ?? getNested(translations.en, key);
      return value === undefined ? fallback : value;
    },
    [lang],
  );

  const te = useCallback(
    (codeOrMessage) => {
      if (!codeOrMessage) return t('common.error');
      const mapped = getNested(translations[lang], `errors.${codeOrMessage}`);
      return mapped || codeOrMessage;
    },
    [lang, t],
  );

  const value = useMemo(() => ({ lang, setLang, t, te, langs: LANGS }), [lang, setLang, t, te]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
