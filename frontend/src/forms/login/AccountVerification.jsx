import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import api from "../../api";
import { useCooldown } from "../../hooks/useCooldown";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useStorageObject from "../../hooks/useStorageObject";

const AccountVerification = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refresh, isAuth, hasRole } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [codeValue, setCodeValue] = useState("");
  const [persisted, setPersisted] = useStorageObject(
    "accountVerification:state",
    { showInputField: false }
  );
  const { cooldown, start: startCooldown } = useCooldown(
    "cooldown:account-verification"
  );
  const showInputField = persisted.showInputField;
  const [pending, setPending] = useState(false);

  const [searchParams] = useSearchParams();
  const isRegistering = searchParams.get("registering") === "true";

  const emailModified = useMemo(
    () => user?.email != email,
    [user?.email, email]
  );

  if (!isAuth) return <Navigate to="/login" replace />;
  if (!hasRole("restricted")) return <Navigate to="/" replace />;

  const handleSave = async () => {
    if (pending) return;
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError(t("account_verification.email_required"));
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t("account_verification.email_invalid"));
      return;
    } else if (email.length > 255) {
      setError(
        t("account_verification.email_too_long", {
          limit: 255,
        })
      );
      return;
    }

    setPending(true);
    setPersisted((prev) => ({ ...prev, showInputField: false }));
    try {
      await api.patch("users/accounts", { email });
      setEmail(email);
      user.email = email;
    } catch (error) {
      console.error("Error updating verification email:", error);
      setSuccessMessage(null);
      setError(t("account_verification.error_updating_email"));
    } finally {
      setPending(false);
    }
  };
  const handleSend = async () => {
    if (pending) return;
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setSuccessMessage(null);
      setError(t("account_verification.email_required"));
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setSuccessMessage(null);
      setError(t("account_verification.email_invalid"));
      return;
    } else if (email.length > 255) {
      setSuccessMessage(null);
      setError(
        t("account_verification.email_too_long", {
          limit: 255,
        })
      );
      return;
    }

    setPending(true);

    try {
      const response = await api.post("/email/send-account-verification", {
        to: email,
        language: i18n.language,
      });

      if (response.status == 200) {
        setError(null);
        setSuccessMessage(t("account_verification.code_sent"));
        setPersisted((prev) => ({ ...prev, showInputField: true }));
        startCooldown(60);
      } else {
        throw new Error(t("account_verification.error_sending_email"));
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      setError(t("account_verification.error_sending_email"));
    } finally {
      setPending(false);
    }
  };

  const handleVerify = async () => {
    if (pending || !codeValue) return;
    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.post("/email/verify-account", {
        token: codeValue,
      });
      if (response.status == 200) {
        await refresh();
        setSuccessMessage(t("account_verification.verification_success"));
        setPersisted((prev) => ({ ...prev, showInputField: false }));
        // Registering path
        if (isRegistering) {
          //   // Try to login
          //   const loginResp = await login(username, location.state?.password);
          //   if (
          //     !(loginResp.status == 200 || loginResp.status == 201)
          //   ) {
          navigate("/login", { replace: true });
          //   }
        }

        navigate("/", { replace: true });
      } else {
        throw new Error(t("account_verification.error_verifying"));
      }
    } catch (error) {
      console.error("Error verifying the code:", error);
      setError(t("account_verification.error_verifying"));
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="card flex flex-col gap-6">
      <h1 className="text-center mb-8 text-title font-bold">
        {t("account_verification.title")}
      </h1>
      {error && <div className="container-error">{error}</div>}
      {!!successMessage && (
        <div className="container-success">{successMessage}</div>
      )}
      <div>
        <div className="flex justify-between items-center">
          <label className="block text-body font-semibold mb-1" htmlFor="email">
            {t("general.email")}
          </label>
          {emailModified && (
            <button
              className="text-caption-blue"
              type="button"
              onClick={handleSave}
            >
              {t("general.save")}
            </button>
          )}
        </div>
        <input
          id="email"
          className={`input-style ${
            !emailModified || pending ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={pending}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setPersisted((prev) => ({ ...prev, showInputField: false }));
            setEmail(e.target.value);
          }}
          placeholder={t("account_verification.email_placeholder")}
        />
      </div>
      {showInputField && (
        <div>
          <label className="block text-body font-semibold mb-1" htmlFor="code">
            {t("account_verification.code_label")}
          </label>
          <input
            id="code"
            className="input-style"
            type="text"
            required={showInputField}
            autoComplete="off"
            inputMode="numeric"
            value={codeValue}
            onChange={(e) => setCodeValue(e.target.value)}
            placeholder={t("account_verification.code_placeholder")}
          />
        </div>
      )}
      <div className="flex gap-2">
        {showInputField && (
          <button
            className={`btn w-full flex-3 ${
              pending || emailModified ? "btn-secondary" : "btn-primary"
            }`}
            disabled={pending || emailModified}
            type="button"
            onClick={handleVerify}
          >
            {t("account_verification.verify")}
          </button>
        )}
        <button
          className={`btn w-full flex-1 whitespace-nowrap ${
            cooldown > 0 || pending || emailModified
              ? "btn-secondary"
              : "btn-primary"
          } ${showInputField ? "opacity-75" : ""}`}
          type="button"
          disabled={cooldown > 0 || pending || emailModified}
          onClick={handleSend}
        >
          {cooldown > 0
            ? `${
                showInputField
                  ? t("account_verification.resend_code")
                  : t("account_verification.send_code")
              } (${cooldown})`
            : `${
                showInputField
                  ? t("account_verification.resend_code")
                  : t("account_verification.send_code")
              }`}
        </button>
      </div>
    </form>
  );
};

export default AccountVerification;
