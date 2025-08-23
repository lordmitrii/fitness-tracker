import { OfflineStatusIcon, OnlineStatusIcon } from "../icons/WifiIcon";
import useNetworkBanner from "../hooks/useNetworkBanner";
import { useTranslation } from "react-i18next";

const OfflineBanner = () => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-x-0 bottom-5 z-9999 flex items-center justify-center mx-auto w-95 px-5 py-3 rounded-2xl shadow-lg btn-danger animate-slide-up gap-1">
      <OfflineStatusIcon />
      <div className="font-semibold text-white">
        {t("network_banner.you_are_offline")}
      </div>
    </div>
  );
};

const OnlineBanner = () => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-x-0 bottom-5 z-9999 flex items-center justify-center mx-auto w-95 px-5 py-3 rounded-2xl shadow-lg btn-success animate-slide-down gap-1">
      <OnlineStatusIcon />
      <div className="font-semibold text-white">
        {t("network_banner.you_are_online")}
      </div>
    </div>
  );
};

export const NetworkStatusBanner = () => {
  const { online, showOnline } = useNetworkBanner();
  if (!online) return <OfflineBanner />;
  if (showOnline) return <OnlineBanner />;
  return null;
};

export default NetworkStatusBanner;
