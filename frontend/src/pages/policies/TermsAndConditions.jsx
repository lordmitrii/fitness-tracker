import { useTranslation, Trans } from "react-i18next";
import { getPolicyVersion } from "../../utils/policiesUtils";
import { Link } from "react-router-dom";

const TermsAndConditions = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto p-4">
      <span className="flex items-end mb-6 gap-2">
        <h1 className="text-title font-bold">{t("terms_and_conditions.title")}</h1>
        <span className="text-caption">v{getPolicyVersion("terms_and_conditions")}</span>
      </span>

      <p className="text-caption mb-6">{t("terms_and_conditions.intro")}</p>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("terms_and_conditions.sections.information_we_collect.title")}
        </h2>
        <p className="text-caption">
          {t("terms_and_conditions.sections.information_we_collect.description")}
        </p>
        <ul className="list-disc list-inside ml-4">
          <li className="text-caption">
            {t(
              "terms_and_conditions.sections.information_we_collect.list.personal_info"
            )}
          </li>
          <li className="text-caption">
            {t(
              "terms_and_conditions.sections.information_we_collect.list.usage_data"
            )}
          </li>
          <li className="text-caption">
            {t("terms_and_conditions.sections.information_we_collect.list.cookies")}
          </li>
          <li className="text-caption">
            <Trans
              i18nKey="terms_and_conditions.sections.information_we_collect.list.health_data"
              components={[
                <Link
                  to="/health-data-policy"
                  key="health-data-link"
                  className="underline text-blue-500"
                />,
              ]}
            />
          </li>
          <li className="text-caption">
            {t(
              "terms_and_conditions.sections.information_we_collect.list.exercise_data"
            )}
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("terms_and_conditions.sections.use_of_information.title")}
        </h2>
        <p className="text-caption">
          {t("terms_and_conditions.sections.use_of_information.description")}
        </p>
        <ul className="list-disc list-inside ml-4">
          <li className="text-caption">
            {t(
              "terms_and_conditions.sections.use_of_information.list.to_provide_services"
            )}
          </li>
          <li className="text-caption">
            {t(
              "terms_and_conditions.sections.use_of_information.list.to_improve_services"
            )}
          </li>
          <li className="text-caption">
            {t(
              "terms_and_conditions.sections.use_of_information.list.to_communicate"
            )}
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("terms_and_conditions.sections.data_sharing.title")}
        </h2>
        <p className="text-caption">
          <Trans
            i18nKey="terms_and_conditions.sections.data_sharing.description"
            components={[
              <a
                href="https://openai.com"
                className="underline text-blue-500"
                target="_blank"
                rel="noopener noreferrer"
                key="openai-link"
              />,
              <a
                href="https://openai.com/policies/privacy-policy"
                className="underline text-blue-500"
                target="_blank"
                rel="noopener noreferrer"
                key="openai-privacy-link"
              />,
            ]}
          />
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("terms_and_conditions.sections.data_security.title")}
        </h2>
        <p className="text-caption">
          {t("terms_and_conditions.sections.data_security.description")}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("terms_and_conditions.sections.your_rights.title")}
        </h2>
        <p className="text-caption">
          {t("terms_and_conditions.sections.your_rights.description")}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-body font-semibold mb-2">
          {t("terms_and_conditions.sections.changes.title")}
        </h2>
        <p className="text-caption">
          {t("terms_and_conditions.sections.changes.description")}
        </p>
      </section>

      <section>
        <h2 className="text-body font-semibold mb-2">
          {t("terms_and_conditions.sections.contact_us.title")}
        </h2>
        <p className="text-caption">
          <Trans
            i18nKey="terms_and_conditions.sections.contact_us.description"
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

export default TermsAndConditions;
