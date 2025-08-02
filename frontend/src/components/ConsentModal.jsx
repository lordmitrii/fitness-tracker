import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";

const ConsentModal = ({ open, onAccept, onDecline }) => {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-4 mx-2">
        <h1 className="text-title font-semibold">{t("consent.title")}</h1>
        <div className="text-body">{t("consent.description")}</div>
        <div className="text-caption">
          <Trans
            i18nKey="consent.privacy_policy"
            components={[
              <Link
                key="privacy-policy-link"
                to="/privacy-policy"
                className="text-blue-500 underline"
              />,
            ]}
          />
        </div>
        <div className="flex justify-center gap-2">
          <button className="btn btn-secondary" onClick={onDecline}>
            {t("consent.decline")}
          </button>
          <button className="btn btn-primary" onClick={onAccept}>
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
