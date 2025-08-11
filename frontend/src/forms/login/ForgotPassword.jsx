import { useTranslation } from "react-i18next";
import { useState } from "react";
import api from "../../api";
import { useCooldown } from "../../hooks/useCooldown";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { cooldown, start: startCooldown } = useCooldown();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setSuccess(false);
      setError(t("forgot_password.email_invalid"));
      return;
    }

    try {
      const response1 = await api.post("/email/send-reset-password", {
        to: email,
      });

      if (response1.status == 200) {
        setError(null);
        setSuccess(true);
        startCooldown(60);
      } else {
        throw new Error(t("forgot_password.error_sending_email"));
      }
    } catch (error) {
      console.error("Error sending reset password email:", error);
      setSuccess(false);
      setError(t("forgot_password.error_sending_email"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
      <h1 className="text-center mb-8 text-title font-bold">
        {t("forgot_password.title")}
      </h1>
      {error && <div className="container-error">{error}</div>}
      {success && (
        <div className="container-success">
          {t("forgot_password.reset_link_sent")}
        </div>
      )}

      <div>
        <label className="block text-body font-semibold mb-1" htmlFor="email">
          {t("general.email")}
        </label>
        <input
          id="email"
          className="input-style"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("forgot_password.email_placeholder")}
        />
      </div>
      <button
        className={`btn w-full ${
          cooldown > 0 ? "btn-secondary" : "btn-primary"
        }`}
        type="submit"
        disabled={cooldown > 0}
      >
        {cooldown > 0
          ? `${t("forgot_password.send_reset_link")} (${cooldown})`
          : t("forgot_password.send_reset_link")}
      </button>
    </form>
  );
};

export default ForgotPassword;
