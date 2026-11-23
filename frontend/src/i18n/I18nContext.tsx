import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, Translations } from './types';
import { uzTranslations } from './locales/uz';
import { ozTranslations } from './locales/oz';

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  translations: Translations;
  t: (path: string, fallback?: string) => string;
  formatDate: (date?: Date | string | number | null) => string;
  getStatusLabel: (status: string) => string;
  getRoleTitle: (role?: string | null, districtName?: string) => string;
}

const STORAGE_KEY = 'toza_hudud_lang';

const TRANSLATIONS: Record<Language, Translations> = {
  uz: uzTranslations,
  oz: ozTranslations
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'oz' ? 'oz' : 'uz';
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  const currentTranslations = useMemo(() => TRANSLATIONS[lang] || uzTranslations, [lang]);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const val = getNestedValue(currentTranslations as unknown as Record<string, unknown>, path);
      if (val !== undefined) return val;
      if (fallback !== undefined) return fallback;
      const uzVal = getNestedValue(uzTranslations as unknown as Record<string, unknown>, path);
      return uzVal !== undefined ? uzVal : path;
    },
    [currentTranslations]
  );

  const formatDate = useCallback(
    (inputDate?: Date | string | number | null): string => {
      const d = inputDate ? new Date(inputDate) : new Date();
      if (isNaN(d.getTime())) return '';
      const day = d.getDate();
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const months = currentTranslations.common.months;
      const monthName = months[monthIdx] || '';
      return `${day} ${monthName} ${year}`;
    },
    [currentTranslations]
  );

  const getStatusLabel = useCallback(
    (status: string): string => {
      const statuses = currentTranslations.common.statuses as Record<string, string>;
      return statuses[status] || status;
    },
    [currentTranslations]
  );

  const getRoleTitle = useCallback(
    (role?: string | null, districtName?: string): string => {
      const r = currentTranslations.common.roles;
      if (!role) return r.staff;
      if (role === 'SuperAdmin') return r.SuperAdmin;
      if (role === 'Manager') {
        const d = districtName || (lang === 'oz' ? 'Туман' : 'Tuman');
        return `${d} ${r.Manager}`;
      }
      if (role === 'Dispatcher') {
        const d = districtName || (lang === 'oz' ? 'Туман' : 'Tuman');
        return `${d} ${r.Dispatcher}`;
      }
      if (role === 'Inspector') {
        const d = districtName || (lang === 'oz' ? 'Ҳудуд' : 'Hudud');
        return `${d} ${r.Inspector}`;
      }
      if (role === 'Driver') {
        const d = districtName || (lang === 'oz' ? 'Туман' : 'Tuman');
        return `${d} ${r.Driver}`;
      }
      return r.staff;
    },
    [currentTranslations, lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      translations: currentTranslations,
      t,
      formatDate,
      getStatusLabel,
      getRoleTitle
    }),
    [lang, setLang, currentTranslations, t, formatDate, getStatusLabel, getRoleTitle]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return ctx;
};
