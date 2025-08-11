import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CheckBox from "../../components/CheckBox";

const EditRolesModal = ({ user, allRoles, saving, onClose, onSave }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(
    (user.roles || []).map((r) => r.name)
  );

  const toggle = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const availableNames = useMemo(
    () => Array.from(new Set((allRoles || []).map((r) => r.name))).sort(),
    [allRoles]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div
        className="absolute inset-0 bg-black/10"
        onClick={() => (saving ? null : onClose())}
      />
      <div className="relative w-full max-w-3xl mx-2 rounded-xl bg-white shadow-xl p-6">
        <h1 className="text-body mb-1">
          {t("admin.edit_roles_for", { email: user.email })}
        </h1>
        <p className="text-caption mb-4">{t("admin.edit_roles_hint")}</p>

        <div className="max-h-64 overflow-auto border border-gray-600 rounded-xl p-3 grid grid-cols-2 gap-2">
          {availableNames.length === 0 ? (
            <span className="text-caption">{t("admin.no_roles_defined")}</span>
          ) : (
            availableNames.map((name) => (
              <label key={name}>
                <span className="flex text-caption items-center gap-2">
                  <CheckBox
                    title={name}
                    checked={selected.includes(name)}
                    onChange={() => toggle(name)}
                  />
                  <span className="capitalize">{name}</span>
                </span>
              </label>
            ))
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            {t("general.cancel")}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSave(selected)}
            disabled={saving}
          >
            {saving ? t("general.saving") : t("general.save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRolesModal;
