import { useTranslation, Trans } from "react-i18next";
import ThemeSwitcher from "../components/ThemeSwitcher";
import LanguageSwitcher from "../components/LanguageSwitcher";
import GitHubIcon from "../icons/GitHubIcon";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-inner py-6">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left text-sm font-medium tracking-wide">
          &copy; {new Date().getFullYear()} Fitness Tracker &mdash;{" "}
          {t("layout.all_rights_reserved")}
        </div>
        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <a
            href="https://github.com/lordmitrii"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-300 transition"
          >
            <GitHubIcon />
          </a>
          <a
            href="mailto:dmitrii.lor@glasgow.ac.uk"
            className="hover:text-blue-300 transition text-sm sm:text-base"
          >
            {t("general.contact_support")}
          </a>
        </div>
        <div className="text-center sm:text-left text-sm font-medium tracking-wide">
          <Trans
            i18nKey="general.our_policies"
            components={[
              <Link
                key="privacy-policy-link"
                to="/privacy-policy"
                className="underline"
              />,
              <Link
                key="health-data-policy-link"
                to="/health-data-policy"
                className="underline"
              />,
            ]}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
