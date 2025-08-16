import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ChevronIcon from "../icons/ChevronIcon";
import LanguageIcon from "../icons/LanguageIcon";

const languages = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "zh", label: "中文" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

  const currentLang =
    languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center"
        // className="
        //   flex items-center justify-between gap-1
        //   w-20 px-2 py-2 rounded-lg border border-white/30
        //   bg-white/90 text-blue-600 font-semibold
        //   shadow-sm hover:border-blue-300
        //   transition text-base
        //   focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200
        // "
        type="button"
      >
        <LanguageIcon />

        {/* <span>{currentLang.label}</span> */}
        {/* <ChevronIcon direction={open ? "up" : "down"} /> */}
      </button>
      {open && (
        <ul
          ref={dropdownRef}
          tabIndex={-1}
          className="
            absolute left-1/2 -translate-x-1/2 top-full mt-1 w-20 z-50
            bg-white border border-gray-700
            rounded-lg shadow-lg space-y-1 p-1
          "
        >
          {languages.map((l) => (
            <li key={l.code}>
              <button
                className={`w-full px-2 py-2 text-left rounded-lg transition
                  ${
                    i18n.language === l.code
                      ? "bg-gray-500 text-gray-200 font-bold"
                      : "hover:bg-gray-50 text-gray-600 font-bold"
                  }
                `}
                onClick={() => {
                  i18n.changeLanguage(l.code);
                  setOpen(false);
                }}
                tabIndex={0}
                type="button"
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
