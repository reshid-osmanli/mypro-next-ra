"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ElementType } from "react";

export type Language = "ar" | "en";
export type ThemeMode = "light" | "dark";
export type LocalizedTextValue = string | { ar: string; en: string };

type SitePreferencesContextValue = {
  language: Language;
  theme: ThemeMode;
  direction: "rtl" | "ltr";
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  text: (value: LocalizedTextValue | undefined | null) => string;
};

const SitePreferencesContext = createContext<SitePreferencesContextValue | null>(null);
const LANGUAGE_KEY = "kutubi-language";
const THEME_KEY = "kutubi-theme";

export function resolveLocalized(value: LocalizedTextValue, language: Language) {
  if (typeof value === "string") return value;
  return value[language] || value.ar;
}

export function SitePreferenceProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedLanguage = localStorage.getItem(LANGUAGE_KEY);
    const storedTheme = localStorage.getItem(THEME_KEY);

    if (storedLanguage === "ar" || storedLanguage === "en") {
      setLanguageState(storedLanguage);
    }
    if (storedTheme === "light" || storedTheme === "dark") {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === "ar" ? "rtl" : "ltr";
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
    localStorage.setItem(LANGUAGE_KEY, language);
    localStorage.setItem(THEME_KEY, theme);
  }, [language, theme]);

  const value = useMemo<SitePreferencesContextValue>(() => ({
    language,
    theme,
    direction: language === "ar" ? "rtl" : "ltr",
    setLanguage(languageValue) {
      setLanguageState(languageValue);
    },
    toggleLanguage() {
      setLanguageState((current) => (current === "ar" ? "en" : "ar"));
    },
    toggleTheme() {
      setThemeState((current) => (current === "dark" ? "light" : "dark"));
    },
    text(localizedValue) {
      if (localizedValue == null) return "";
      return resolveLocalized(localizedValue, language);
    }
  }), [language, theme]);

  return (
    <SitePreferencesContext.Provider value={value}>
      {children}
    </SitePreferencesContext.Provider>
  );
}

export function useSitePreferences() {
  const context = useContext(SitePreferencesContext);
  if (!context) throw new Error("useSitePreferences must be used inside SitePreferenceProvider");
  return context;
}

export function LocalizedText({
  value,
  as,
  className
}: {
  value: LocalizedTextValue;
  as?: ElementType;
  className?: string;
}) {
  const { text } = useSitePreferences();
  const Component = as ?? "span";
  return <Component className={className}>{text(value)}</Component>;
}
