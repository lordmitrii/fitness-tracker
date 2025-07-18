import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const validatePassword = (password) => {
    if (!password || password.length < 8) {
      return t("register_form.password_min_length");
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const resp = await register(email, password);
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
      {error && (
        <div className="container-error">
          {error}
        </div>
      )}
      <div>
        <label
          className="block text-body font-semibold mb-1"
          htmlFor="email"
        >
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
