
import { useTranslation } from "react-i18next";

const languages = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
  { code: "tg", label: "Тоҷикӣ" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  function changeLanguage(event) {
    const language = event.target.value;

    i18n.changeLanguage(language);
    localStorage.setItem("medfind-language", language);
  }

  return (
    <select
      aria-label="Choose language"
      value={i18n.resolvedLanguage?.split("-")[0] || "ru"}
      onChange={changeLanguage}
      className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
    >
      {languages.map((language) => (
        <option key={language.code} value={language.code}>
          {language.label}
        </option>
      ))}
    </select>
  );
}
