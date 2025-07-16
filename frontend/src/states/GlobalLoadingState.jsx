import SpinnerIcon from "../icons/SpinnerIcon";
import { useTranslation } from "react-i18next";

const GlobalLoadingState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 mx-4">
      <p className="text-4xl font-extrabold text-center bg-gradient-to-l from-blue-600 via-sky-600 to-blue-500 bg-clip-text text-transparent">
        {t("global_loading.welcome")}
      </p>
      <span className="sr-only">{t("global_loading.loading_message")}</span>
      <SpinnerIcon />
    </div>
  );
};

export default GlobalLoadingState;
