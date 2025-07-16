import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const LoginForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const resp = await login(email, password);
    if (resp.access_token) {
      navigate("/");
    } else {
      setError(resp.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800">
        {t("login_form.login_title")}
      </h1>
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 text-center rounded py-2 px-3 mb-2 text-sm">
          {error}
        </div>
      )}
      <div>
        <label
          className="block text-gray-700 font-semibold mb-1"
          htmlFor="email"
        >
          {t("general.email")}
        </label>
        <input
          id="email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          placeholder="username@example.com"
        />
      </div>
      <div>
        <label
          className="block text-gray-700 font-semibold mb-1"
          htmlFor="password"
        >
          {t("general.password")}
        </label>
        <input
          id="password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder={t("login_form.password_placeholder")}
        />
      </div>
      <button className="btn btn-primary w-full" type="submit">
        {t("general.login")}
      </button>
      <div className="text-center text-sm text-gray-600 mt-2">
        {t("login_form.not_registered")}{" "}
        <Link
          to="/register"
          className="text-blue-600 hover:underline font-semibold"
        >
          {t("general.register")}
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
