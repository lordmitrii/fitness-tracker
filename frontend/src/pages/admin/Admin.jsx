import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminNav from "../../components/admin/AdminNav";

const Admin = () => {
  const { t } = useTranslation();

  return (
    <div className="grow flex flex-col sm:flex-row pb-6 sm:pb-0">
      <aside className="border-b sm:border-b-0 sm:border-r border-gray-600 bg-white">
        <div className="p-4">
          <h1 className="text-title">{t("admin.title_main")}</h1>
        </div>
        <AdminNav />
      </aside>
      <main className="grow p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Admin;
