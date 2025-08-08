import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import CheckBox from "../components/CheckBox";
import { PRIVACY_POLICY_VERSION, HEALTH_DATA_POLICY_VERSION } from "../utils/policiesUtils";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [healthDataConsent, setHealthDataConsent] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (password.length < 8) {
      newErrors.password = t("register_form.password_min_length");
    }

    if (!privacyConsent) {
      newErrors.privacyConsent = t(
        "register_form.privacy_policy_consent_missing"
      );
    }

    if (!healthDataConsent) {
      newErrors.healthDataConsent = t(
        "register_form.health_data_consent_missing"
      );
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const resp = await register(
      email,
      password,
      privacyConsent,
      PRIVACY_POLICY_VERSION,
      healthDataConsent,
      HEALTH_DATA_POLICY_VERSION
    );
    if (resp.status === 201) {
      navigate("/login");
    } else {
      setError(resp.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
      <h1 className="text-center mb-8 text-title font-bold">
        {t("register_form.register_title")}
      </h1>
      {error && <div className="container-error">{error}</div>}
      <div>
        <label className="block text-body font-semibold mb-1" htmlFor="email">
          {t("general.email")}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="username@example.com"
          className="input-style"
        />
      </div>
      <div>
        <label
          className="block text-body font-semibold mb-1"
          htmlFor="password"
        >
          {t("general.password")}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder={t("register_form.password_placeholder")}
          className="input-style"
        />
        {formErrors.password && (
          <p className="text-caption-red mt-1">{formErrors.password}</p>
        )}
      </div>
      <div className="flex sm:flex-row flex-col items-center justify-between gap-2">
        <div className="flex flex-col justify-center w-full">
          <span className="flex text-caption items-center gap-2">
            <CheckBox
              title="Privacy Policy Consent"
              checked={privacyConsent}
              onChange={(e) => {
                setPrivacyConsent(e.target.checked);
                setFormErrors((prev) => ({ ...prev, privacyConsent: null }));
              }}
            />
            <span>
              <Trans
                i18nKey="register_form.privacy_policy_consent"
                components={[
                  <Link
                    key="privacy-policy-link"
                    to="/privacy-policy"
                    className="text-blue-500 underline"
                  />,
                ]}
              />
            </span>
          </span>
          {(formErrors.privacyConsent || formErrors.healthDataConsent) && (
            <p className="text-caption-red mt-1">
              {formErrors.privacyConsent || "\u00A0"}
            </p>
          )}
        </div>
        <div className="flex flex-col justify-start w-full">
          <span className="flex text-caption items-center gap-2">
            <CheckBox
              title="Health Data Policy Consent"
              checked={healthDataConsent}
              onChange={(e) => {
                setHealthDataConsent(e.target.checked);
                setFormErrors((prev) => ({ ...prev, healthDataConsent: null }));
              }}
            />
            <span>
              <Trans
                i18nKey="register_form.health_data_consent"
                components={[
                  <Link
                    key="health-data-policy-link"
                    to="/health-data-policy"
                    className="text-blue-500 underline"
                  />,
                ]}
              />
            </span>
          </span>
          {(formErrors.healthDataConsent || formErrors.privacyConsent) && (
            <p className="text-caption-red mt-1">
              {formErrors.healthDataConsent || "\u00A0"}
            </p>
          )}
        </div>
      </div>
      <button type="submit" className="btn btn-primary w-full">
        {t("general.register")}
      </button>
      <div className="text-center text-caption mt-2">
        {t("register_form.already_have_account")}{" "}
        <Link
          to="/login"
          className="text-caption-blue hover:underline font-semibold"
        >
          {t("general.login")}
        </Link>
      </div>
    </form>
  );
};

export default RegisterForm;
