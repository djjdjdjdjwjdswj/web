import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const dict = {
  ru: {
    menu: "Меню",
    feed: "Лента",
    chats: "Чаты",
    my_profile: "Мой профиль",
    settings: "Настройки",
    logout_in_profile: "Выйти (в профиле)",
    comments: "Комментарии",
    write_comment: "Написать комментарий…",
    reply: "Ответ…",
    comment: "Комментарий…",
    send: "Отправить",
    not_found: "Не найдено",
  },
  ua: {
    menu: "Меню",
    feed: "Стрічка",
    chats: "Чати",
    my_profile: "Мій профіль",
    settings: "Налаштування",
    logout_in_profile: "Вийти (у профілі)",
    comments: "Коментарі",
    write_comment: "Написати коментар…",
    reply: "Відповідь…",
    comment: "Коментар…",
    send: "Надіслати",
    not_found: "Не знайдено",
  },
  en: {
    menu: "Menu",
    feed: "Feed",
    chats: "Chats",
    my_profile: "My profile",
    settings: "Settings",
    logout_in_profile: "Logout (in profile)",
    comments: "Comments",
    write_comment: "Write a comment…",
    reply: "Reply…",
    comment: "Comment…",
    send: "Send",
    not_found: "Not found",
  },
};

const I18nCtx = createContext({ lang: "ru", setLang: () => {}, t: (k) => k });

function readLang(){
  try {
    const raw = localStorage.getItem("app_settings");
    if (!raw) return "ru";
    const s = JSON.parse(raw);
    return (s?.lang === "ua" || s?.lang === "en" || s?.lang === "ru") ? s.lang : "ru";
  } catch {
    return "ru";
  }
}

export function I18nProvider({ children }){
  const [lang, setLangState] = useState(readLang());

  const setLang = (next) => {
    const v = (next === "ua" || next === "en" || next === "ru") ? next : "ru";
    setLangState(v);
    try {
      const raw = localStorage.getItem("app_settings");
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem("app_settings", JSON.stringify({ ...prev, lang: v }));
    } catch {}
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "app_settings") setLangState(readLang());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const t = useMemo(() => {
    const d = dict[lang] || dict.ru;
    return (k) => d[k] || dict.ru[k] || k;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(){
  return useContext(I18nCtx);
}
