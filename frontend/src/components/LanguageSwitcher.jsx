import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import LanguageIcon from "../icons/LanguageIcon";
import DropdownSelect from "./DropdownSelect";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = useMemo(
    () => [
      { value: "en", label: "EN" },
      { value: "ru", label: "RU" },
      { value: "zh", label: "中文" },
    ],
    []
  );

  // const currentLang =
  //   languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <DropdownSelect
      value={i18n.language}
      onChange={(lang) => {
        i18n.changeLanguage(lang);
      }}
      options={languages}
      renderButton={({ buttonProps }) => (
        <button {...buttonProps} className="p-2">
          <LanguageIcon />
        </button>
      )}
      menuWidth={"w-20"}
    />
  );
};

export default LanguageSwitcher;
