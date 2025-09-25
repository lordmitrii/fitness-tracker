import { useAuth } from "../../context/AuthContext";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import CheckBox from "../../components/CheckBox";
import useVersionsData from "../../hooks/data/userVersionsData";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, register, isRefreshing, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [healthDataConsent, setHealthDataConsent] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const { getVersion } = useVersionsData({ skipQuery: false });

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!email) {
      newErrors.email = t("register_form.email_required");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t("register_form.email_invalid");
    } else if (email.length > 255) {
      newErrors.email = t("register_form.email_too_long", {
        limit: 255,
      });
    }

    if (!username) {
      newErrors.username = t("register_form.username_required");
    } else if (username.length < 6) {
      newErrors.username = t("register_form.username_min_length", {
        minLength: 6,
      });
    } else if (username.length > 50) {
      newErrors.username = t("register_form.username_too_long", {
        limit: 50,
      });
    }

    if (!password) {
      newErrors.password = t("register_form.password_required");
    } else if (password.length < 8) {
      newErrors.password = t("register_form.password_min_length", {
        minLength: 8,
      });
    } else if (password.length > 128) {
      newErrors.password = t("register_form.password_too_long", {
        limit: 128,
      });
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
  }, [email, username, password, privacyConsent, healthDataConsent, t]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setFormErrors({});

      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const healthDataConsentVersion = getVersion("healthDataPolicy");
      const privacyConsentVersion = getVersion("privacyPolicy");

      const resp = await register(
        username,
        email,
        password,
        privacyConsent,
        privacyConsentVersion,
        healthDataConsent,
        healthDataConsentVersion
      );
      if (resp.status == 201 || resp.status == 200) {
        const loginResp = await login(username, password);
        if (loginResp.status == 201 || loginResp.status == 200) {
          navigate("/account-verification?registering=true", { replace: true });
        } else {
          // Unsuccessful login
          navigate("/login", { replace: true });
        }
      } else {
        setError(resp.message);
      }
    },
    [
      email,
      username,
      password,
      privacyConsent,
      healthDataConsent,
      validateForm,
      navigate,
    ]
  );

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
        {formErrors.email && (
          <p className="text-caption-red mt-1">{formErrors.email}</p>
        )}
      </div>
      <div>
        <label
          className="block text-body font-semibold mb-1"
          htmlFor="username"
        >
          {t("general.username")}
        </label>
        <input
          id="username"
          type="text"
          value={username}
          autoComplete="off"
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="user123"
          className="input-style"
        />
        {formErrors.username && (
          <p className="text-caption-red mt-1">{formErrors.username}</p>
        )}
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
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isRefreshing || loading}
      >
        {t("general.continue")}
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
