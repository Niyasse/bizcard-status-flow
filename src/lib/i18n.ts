// Minimal English/Malayalam strings for navigation and account screens.
import { useSyncExternalStore } from "react";
import { settingsStore, type Language } from "@/services/admin";

const dict = {
  discover: { en: "Discover", ml: "കണ്ടെത്തുക" },
  categories: { en: "Categories", ml: "വിഭാഗങ്ങൾ" },
  myCards: { en: "My Cards", ml: "എന്റെ കാർഡുകൾ" },
  updates: { en: "Updates", ml: "അപ്ഡേറ്റുകൾ" },
  login: { en: "Login", ml: "ലോഗിൻ" },
  settings: { en: "Settings", ml: "ക്രമീകരണങ്ങൾ" },
  logout: { en: "Log out", ml: "ലോഗൗട്ട്" },
  language: { en: "Language", ml: "ഭാഷ" },
} as const;

export type TKey = keyof typeof dict;
export const translate = (k: TKey, lang: Language) => dict[k][lang];

export function useLanguage() {
  const s = useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
  return {
    language: s.language,
    setLanguage: (language: Language) => settingsStore.set({ ...settingsStore.get(), language }),
    t: (k: TKey) => translate(k, s.language),
  };
}
