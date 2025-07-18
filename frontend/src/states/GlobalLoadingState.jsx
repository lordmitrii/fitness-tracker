import SpinnerIcon from "../icons/SpinnerIcon";
import { useTranslation } from "react-i18next";

const GlobalLoadingState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 mx-4 bg-white">
      <p className="text-title-blue-gradient font-extrabold text-center via-sky-600 mx-10">
        {t("global_loading.welcome")}
      </p>
      <span className="sr-only">{t("global_loading.loading_message")}</span>
      <SpinnerIcon />
    </div>
  );
};

export default GlobalLoadingState;
