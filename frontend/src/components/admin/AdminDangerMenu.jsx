import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api";

const DangerMenu = ({ user, onDone, setError }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(null);

  const act = async (label, call) => {
    setError(null);
    setBusy(label);
    try {
      await call();
      onDone();
    } catch (error) {
      console.error("Error resettig user's email:", error)
      setError(error?.response?.data?.error || error?.response?.data?.message || error?.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <button
        className="btn btn-secondary whitespace-nowrap"
        disabled={busy !== null}
        onClick={() =>
          confirm(t("admin.confirm_password_reset")) &&
          act("reset", () => api.post(`/admin/users/${user.id}/password-reset`))
        }
      >
        {busy === "reset" ? t("general.working") : t("admin.reset_password")}
      </button>
      <button
        className="btn btn-danger whitespace-nowrap"
        disabled={busy !== null}
        onClick={() => {
          const ok = prompt(t("admin.type_delete_to_confirm")) === "DELETE";
          if (!ok) return;
          return act("delete", () => api.delete(`/admin/users/${user.id}`));
        }}
      >
        {busy === "delete" ? t("general.working") : t("general.delete")}
      </button>
    </>
  );
};

export default DangerMenu;
