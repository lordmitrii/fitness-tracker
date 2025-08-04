import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";
import useScrollLock from "../hooks/useScrollLock";

const ConsentModal = ({ open, onAccept, onDecline }) => {
  const { t } = useTranslation();
  useScrollLock(open);

  if (!open) return null;


  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-4 mx-2 max-w-3xl">
        <h1 className="text-title font-semibold">{t("consent_modal.title")}</h1>
        <div className="text-body">
          <Trans
            i18nKey="consent_modal.description"
            components={[
              <Link
                key="openai-link"
                to="https://openai.com"
                className="text-blue-500 underline"
                target="_blank"
                rel="noopener noreferrer"
              />,
            ]}
          />
        </div>
        <div className="text-caption">
          <Trans
            i18nKey="consent_modal.privacy_policy"
            components={[
              <Link
                key="privacy-policy-link"
                to="/privacy-policy"
                className="text-blue-500 underline"
              />,
              <Link
                key="health-data-policy-link"
                to="/health-data-policy"
                className="text-blue-500 underline"
              />,
            ]}
          />
        </div>
        <div className="flex justify-center gap-2">
          <button className="btn btn-secondary" onClick={onDecline}>
            {t("consent_modal.decline")}
          </button>
          <button className="btn btn-primary" onClick={onAccept}>
            {t("consent_modal.accept")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
