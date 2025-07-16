import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const languages = [
    { code: "en", label: "EN" },
    { code: "ru", label: "RU" },
    { code: "zh", label: "中文" },
  ];
  return (
    <div className="flex space-x-2">
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          className={i18n.language === l.code ? "font-bold" : "font-normal"}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
