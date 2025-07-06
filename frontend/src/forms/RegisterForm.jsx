import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const validatePassword = (password) => {
    if (!password || password.length < 8) {
      return "Password must be at least 8 characters.";
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
    <div className="min-h-screen bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 flex flex-col gap-6"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800">
          Register
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
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="username@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>
        <div>
          <label
            className="block text-gray-700 font-semibold mb-1"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
        >
          Register
        </button>
        <div className="text-center text-sm text-gray-600 mt-2">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-semibold"
          >
            Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
