import { Link } from "react-router-dom";
import AppleIcon from "../icons/AppleIcon";
import AndroidIcon from "../icons/AndroidIcon";
import ShareIcon from "../icons/ShareIcon";
import AddToHomeScreenAppleIcon from "../icons/AddToHomeScreenAppleIcon";
import { VerticalDots } from "../icons/DotsIcon";
import { Trans, useTranslation } from "react-i18next";

const InstallationGuide = () => {
  const { t } = useTranslation();
  return (
    <div className="card flex flex-col items-center">
      <h1 className="text-title-blue-gradient font-bold mb-2 text-center">
        {t("installation_guide.installation_guide")}  
      </h1>
      <h2 className="text-body mb-10 text-center">
        {t("installation_guide.steps_below")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* iOS */}
        <div className="flex flex-col items-center w-full">
          <div className="flex items-center gap-2 mb-4">
            <AppleIcon />
            <span className="font-semibold text-body-blue">iOS</span>
          </div>
          <ul className="flex flex-col gap-3 w-full text-body">
            <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
              <span className="font-bold text-body-blue">1</span>
              <span>
                <Trans
                  i18nKey="installation_guide.ios_steps.1"
                  components={[
                    <span className="font-semibold" />, // <0>
                    <span className="inline-block align-middle">
                      <ShareIcon />
                    </span>, // <1>
                  ]}
                />
              </span>
            </li>
            <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
              <span className="font-bold text-body-blue">2</span>
              <span>
                <Trans
                  i18nKey="installation_guide.ios_steps.2"
                  components={[
                    <span className="font-semibold" />, // <0>
                    <span className="inline-block align-middle">
                      <AddToHomeScreenAppleIcon />
                    </span>, // <1>
                  ]}
                />
              </span>
            </li>
            <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
              <span className="font-bold text-body-blue">3</span>
              <span>
                <Trans
                  i18nKey="installation_guide.ios_steps.3"
                  components={[
                    <span className="font-semibold" />, // <0>
                  ]}
                />
              </span>
            </li>
          </ul>
        </div>
        {/* Android */}
        <div className="flex flex-col items-center w-full">
          <div className="flex items-center gap-2 mb-4">
            <AndroidIcon />
            <span className="font-semibold text-body-blue">Android</span>
          </div>
          <ul className="flex flex-col gap-3 w-full text-body">
            <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
              <span className="font-bold text-body-blue">1</span>
              <span>
                <Trans
                  i18nKey="installation_guide.android_steps.1"
                  components={[
                    <span className="font-semibold" />, // <0>
                  ]}
                />
              </span>
            </li>
            <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
              <span className="font-bold text-body-blue">2</span>
              <span>
                <Trans
                  i18nKey="installation_guide.android_steps.2"
                  components={[
                    <span className="font-semibold" />, // <0>
                    <span className="inline-block align-middle">
                      <VerticalDots color="text-blue-500" />
                    </span>, // <1>
                  ]}
                />
              </span>
            </li>
            <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
              <span className="font-bold text-body-blue">3</span>
              <span>
                <Trans
                  i18nKey="installation_guide.android_steps.3"
                  components={[
                    <span className="font-semibold" />, // <0>
                    <span className="font-semibold" />, // <1>
                  ]}
                />
              </span>
            </li>
            <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
              <span className="font-bold text-body-blue">4</span>
              <span>
                <Trans
                  i18nKey="installation_guide.android_steps.4"
                  components={[
                    <span className="font-semibold" />, // <0>
                  ]}
                />
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-body text-center mt-8">
        {t("installation_guide.success_message")}
      </div>
      <div className="mt-12 flex flex-col items-center gap-2 w-full">
        <Link to="/" className="btn btn-primary">
          {t("general.back_home")}
        </Link>
        <div className="text-caption mt-3 text-center">
          {t("installation_guide.need_help")}{" "}
          <a
            href="mailto:help.ftrackerapp@mail.com"
            className="underline hover:text-blue-500"
          >
            {t("general.contact_support")}
          </a>
        </div>
      </div>
    </div>
  );
};

export default InstallationGuide;
