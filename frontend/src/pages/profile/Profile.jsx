import { useTranslation } from "react-i18next";
import { LayoutHeader } from "../../layout/LayoutHeader";
import ProfileNav from "../../components/profile/ProfileNav";
import { Outlet } from "react-router-dom";

const Profile = () => {
  const { t } = useTranslation();

  return (
    <>
      <LayoutHeader disablePaddingBottom>
        <h1 className="text-title font-bold px-4">{t("general.profile")}</h1>
        <ProfileNav />
      </LayoutHeader>

      <div className="grow flex min-h-0 overflow-hidden flex-row">
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Profile;
