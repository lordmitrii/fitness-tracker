import { Link } from "react-router-dom";
import WarningIcon from "../icons/WarningIcon";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="card flex flex-col items-center">
      <div className="flex w-16 h-16 text-yellow-400 mb-4 justify-center items-center rounded-full bg-yellow-100">
        <WarningIcon />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">404</h1>
      <p className="text-xl font-semibold text-gray-700 mb-2">
        {t("not_found.page_not_found")}
      </p>
      <p className="text-gray-500 mb-6 text-center">
        {t("not_found.oops_message")}
      </p>
      <Link to="/" className="btn btn-primary">
        {t("general.back_home")}
      </Link>
    </div>
  );
};
export default NotFound;
