import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ErrorState from "../../states/ErrorState";
import LoadingState from "../../states/LoadingState";
import api from "../../api";

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [linkValid, setLinkValid] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      setError(null);

      if (!token) {
        setLinkValid(false);
        setLoading(false);
        return;
      }

      try {
        const response = await api.post("/email/validate-token", {
          token,
          token_type: "reset_password",
        });

        if (response.status !== 200) {
          setLinkValid(false);
          return;
        }

        setLinkValid(true);
      } catch (error) {
        setLinkValid(false);
        console.error("Error verifying token:", error);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setError(t("reset_password.passwords_mismatch"));
      return false;
    }

    if (password.length < 8) {
      setError(t("reset_password.password_min_length", { minLength: 8 }));
      return false;
    } else if (password.length > 128) {
      setError(t("reset_password.password_too_long", { limit: 128 }));
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    try {
      const response = await api.post("/email/reset-password", {
        token,
        new_password: password,
      });

      if (response.status === 200) {
        sessionStorage.setItem("hasLoaded", "1");
        navigate("/login");
      } else {
        setError(t("reset_password.reset_failed"));
        console.error("Password reset failed:", response.data);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError(t("reset_password.reset_failed"));
    }
  };

  if (loading)
    return <LoadingState message={t("reset_password.verifying_link")} />;
  if (!linkValid)
    return (
      <ErrorState
        error={t("reset_password.invalid_link")}
        onRetry={() => navigate("/forgot-password")}
      />
    );

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
      <h1 className="text-center mb-8 text-title font-bold">
        {t("reset_password.title")}
      </h1>
      {error && <div className="container-error">{error}</div>}
      <div>
        <label
          className="block text-body font-semibold mb-1"
          htmlFor="new-password"
        >
          {t("reset_password.new_password_label")}
        </label>
        <input
          id="new-password"
          className="input-style"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("reset_password.new_password_placeholder")}
        />
      </div>
      <div>
        <label
          className="block text-body font-semibold mb-1"
          htmlFor="confirm-password"
        >
          {t("reset_password.confirm_password_label")}
        </label>
        <input
          id="confirm-password"
          className="input-style"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("reset_password.confirm_password_placeholder")}
        />
      </div>

      <button className="btn btn-primary w-full" type="submit">
        {t("reset_password.reset_password_button")}
      </button>
    </form>
  );
};

export default ResetPassword;
