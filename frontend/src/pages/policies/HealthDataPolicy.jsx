import { useTranslation, Trans } from "react-i18next";
import { getPolicyVersion } from "../../utils/policiesUtils";

const HealthDataPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto p-4">
      <span className="flex items-end mb-6 gap-2">
        <h1 className="text-title font-bold">{t("health_data_policy.title")}</h1>
        <span className="text-caption">v{getPolicyVersion("health_data")}</span>
      </span>

      <p className="text-caption mb-6">{t("health_data_policy.intro")}</p>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("health_data_policy.sections.what_is_health_data.title")}
        </h2>
        <p className="text-caption">
          {t("health_data_policy.sections.what_is_health_data.description")}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("health_data_policy.sections.how_we_use.title")}
        </h2>
        <p className="text-caption">
          {t("health_data_policy.sections.how_we_use.description")}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("health_data_policy.sections.data_sharing.title")}
        </h2>
        <p className="text-caption">
          <Trans
            i18nKey="health_data_policy.sections.data_sharing.description"
            components={[
              <a
                href="https://openai.com/policies/privacy-policy"
                className="underline text-blue-500"
                target="_blank"
                rel="noopener noreferrer"
                key="openai-policy-link"
              />
            ]}
          />
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("health_data_policy.sections.data_security.title")}
        </h2>
        <p className="text-caption">
          {t("health_data_policy.sections.data_security.description")}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("health_data_policy.sections.your_rights.title")}
        </h2>
        <p className="text-caption">
          {t("health_data_policy.sections.your_rights.description")}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("health_data_policy.sections.consent.title")}
        </h2>
        <p className="text-caption">
          {t("health_data_policy.sections.consent.description")}
        </p>
      </section>

      <section>
        <h2 className="text-body font-semibold mb-2">
          {t("health_data_policy.sections.contact_us.title")}
        </h2>
        <p className="text-caption">
          <Trans
            i18nKey="health_data_policy.sections.contact_us.description"
            components={[
              <a
                href="mailto:support@ftrackerapp.co.uk"
                className="underline text-blue-500"
                key="support-link"
              />,
            ]}
          />
        </p>
      </section>
    </div>
  );
};

export default HealthDataPolicy;
