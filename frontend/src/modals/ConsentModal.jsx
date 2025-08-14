import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";
import Modal from "./Modal";

const ConsentModal = ({ onAccept, onDecline }) => {
  const { t } = useTranslation();

  return (
    <Modal onRequestClose={onDecline}>
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
      <div className="flex gap-2 justify-between mt-3">
        <button className="btn btn-secondary" onClick={onDecline}>
          {t("consent_modal.decline")}
        </button>
        <button className="btn btn-primary" onClick={onAccept}>
          {t("consent_modal.accept")}
        </button>
      </div>
    </Modal>
  );
};

export default ConsentModal;
