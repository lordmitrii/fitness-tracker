import { useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const LoginForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, isRefreshing, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      const resp = await login(username, password);
      if (resp.status == 200 || resp.status == 201) {
        navigate("/", { replace: true });
      } else {
        setError(resp.message);
      }
    },
    [username, password, login, navigate]
  );

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
      <h1 className="text-center mb-8 text-title font-bold">
        {t("login_form.login_title")}
      </h1>
      {error && <div className="container-error">{error}</div>}
      <div>
        <label className="block text-body font-semibold mb-1" htmlFor="username">
          {t("general.username")}
        </label>
        <input
          id="username"
          className="input-style"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="off"
          placeholder="user1234"
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-body font-semibold" htmlFor="password">
            {t("general.password")}
          </label>
          <Link
            to="/forgot-password"
            className="text-caption-blue hover:underline font-semibold"
          >
            {t("login_form.forgot_password")}
          </Link>
        </div>
        <input
          id="password"
          className="input-style"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder={t("login_form.password_placeholder")}
        />
      </div>
      <button
        className="btn btn-primary w-full"
        type="submit"
        disabled={isRefreshing || loading}
      >
        {t("general.login")}
      </button>
      <div className="text-center text-caption mt-2">
        {t("login_form.not_registered")}{" "}
        <Link
          to="/register"
          className="text-caption-blue hover:underline font-semibold"
        >
          {t("general.register")}
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
