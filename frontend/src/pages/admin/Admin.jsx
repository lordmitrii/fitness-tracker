import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminNav from "../../components/admin/AdminNav";
import { LayoutHeader } from "../../layout/LayoutHeader";

const Admin = () => {
  const { t } = useTranslation();

  return (
    <>
      <LayoutHeader>
        <h1 className="text-title font-bold px-4">{t("admin.title_main")}</h1>
        <AdminNav />
      </LayoutHeader>

      <div className="grow flex min-h-0 overflow-hidden flex-row">
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Admin;
