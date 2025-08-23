import {useTranslation} from "react-i18next";
import { useEffect, useState } from "react";
import SpinnerIcon from "../icons/SpinnerIcon";
import useScrollLock from "../hooks/useScrollLock";

const GlobalLoadingState = ({ blocking }) => {
  const { t } = useTranslation();
  const [appLoading, setAppLoading] = useState(() => {
    if (sessionStorage.getItem("hasLoaded") === "1") return false;
    return true;
  });

  useEffect(() => {
    if (blocking === undefined) {
      if (!appLoading) return;
      const timeout = setTimeout(() => {
        setAppLoading(false);
        sessionStorage.setItem("hasLoaded", "1");
      }, 1500);
      return () => clearTimeout(timeout);
    } else {
      if (!blocking) {
        setAppLoading(false);
        sessionStorage.setItem("hasLoaded", "1");
      }
    }
  }, [blocking, appLoading]);

  useScrollLock(appLoading);
  if (!appLoading) return null;

  return (
    <div className="fixed inset-0 z-500 h-full w-full flex flex-col items-center justify-center gap-10 bg-white">
      <p className="text-title-blue-gradient font-extrabold text-center via-sky-600 mx-10">
        {t("global_loading.welcome")}
      </p>
      <span className="sr-only">{t("global_loading.loading_message")}</span>
      <SpinnerIcon />
    </div>
  );
};

export default GlobalLoadingState;
