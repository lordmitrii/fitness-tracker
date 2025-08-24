import { OfflineStatusIcon, OnlineStatusIcon } from "../icons/WifiIcon";
import useNetworkBanner from "../hooks/useNetworkBanner";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const OfflineBanner = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  return (
    <>
      {open && (
        <div className="fixed inset-x-0 top-[max(env(safe-area-inset-top),_0.75rem)] z-9999 mx-auto w-95 rounded-2xl shadow-lg btn-danger animate-slide-down-in">
          <button
            className="flex items-center justify-center w-full gap-1 px-5 py-3"
            onClick={() => setOpen(false)}
          >
            <OfflineStatusIcon />
            <div className="font-semibold text-white">
              {t("network_banner.you_are_offline")}
            </div>
          </button>
        </div>
      )}
    </>
  );
};

const OnlineBanner = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  return (
    <>
      {open && (
        <div className="fixed inset-x-0 top-[max(env(safe-area-inset-top),_0.75rem)] z-9999 mx-auto w-95 rounded-2xl shadow-lg btn-success animate-slide-up-out">
          <button
            className="flex items-center justify-center w-full gap-1 px-5 py-3"
            onClick={() => setOpen(false)}
          >
            <OnlineStatusIcon />
            <div className="font-semibold text-white">
              {t("network_banner.you_are_online")}
            </div>
          </button>
        </div>
      )}
    </>
  );
};

export const NetworkStatusBanner = () => {
  const { online, showOnline } = useNetworkBanner();
  if (!online) return <OfflineBanner />;
  if (showOnline) return <OnlineBanner />;
  return null;
};

export default NetworkStatusBanner;
