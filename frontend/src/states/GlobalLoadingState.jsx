import SpinnerIcon from "../icons/SpinnerIcon";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import useScrollLock from "../hooks/useScrollLock";

const GlobalLoadingState = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const spinner = searchParams.get("spinner");
  const [appLoading, setAppLoading] = useState(() => {
    if (sessionStorage.getItem("hasLoaded") === "1") {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (!appLoading) return;

    const timeout = setTimeout(() => {
      setAppLoading(false);
      sessionStorage.setItem("hasLoaded", "1");
    }, 1500); // 1.5 seconds delay to simulate loading

    return () => clearTimeout(timeout);
  }, []);

  useScrollLock(appLoading && spinner !== "false");

  if (appLoading && spinner !== "false") {
    return (
      <div className="fixed inset-0 z-9999 h-full w-full flex flex-col items-center justify-center gap-10 bg-white">
        <p className="text-title-blue-gradient font-extrabold text-center via-sky-600 mx-10">
          {t("global_loading.welcome")}
        </p>
        <span className="sr-only">{t("global_loading.loading_message")}</span>
        <SpinnerIcon />
      </div>
    );
  }

  return null;
};

export default GlobalLoadingState;
