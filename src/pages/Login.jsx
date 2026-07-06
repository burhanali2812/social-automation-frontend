import React, { useState } from "react";
import api  from "../api/axios";
import { useNavigate } from "react-router-dom";
function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateFields = () => {
    if (!email || !password) {
      alert("Please fill in all fields.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    return true;
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) {
      return;
    }
    setLoading(true);
    try {
        const response = await api.post("/user/login", { email, password });
        if(response.data.success) {
            alert("Login successful!");
        }
        if (!response.data.success) {
            alert(response.data.message || "Login failed. Please try again.");
            setLoading(false);
            return;
        }

        
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/dashboard");
        setLoading(false);
    } catch (error) {
        alert(error.response?.data?.error || "Login failed. Please try again.");
        console.error("Login failed:", error);
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen  from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* Left Side */}
        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-12 relative">

          <div className="absolute top-8 left-8">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <i className="fa-solid fa-rocket text-2xl"></i>
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  Social Automation
                </h2>
                <p className="text-sm text-gray-200">
                  AI Powered Platform
                </p>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Manage All Your Social Platforms In One Place
            </h1>

            <p className="text-lg text-gray-200 leading-relaxed">
              Automate content publishing, generate AI captions,
              and manage multiple companies from a centralized dashboard.
            </p>
          </div>

          <div className="mt-12 flex gap-8">
            <div>
              <h3 className="text-3xl font-bold">24/7</h3>
              <p className="text-gray-300">Automation</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold">AI</h3>
              <p className="text-gray-300">Powered</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold">100%</h3>
              <p className="text-gray-300">Centralized</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-8 sm:p-12 flex items-center">
          <div className="w-full">

            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-10">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                <i className="fa-solid fa-rocket text-2xl"></i>
              </div>

              <h2 className="text-3xl font-bold mt-4">
                Social Automation
              </h2>

              <p className="text-gray-500 mt-2">
                Welcome back! Please sign in.
              </p>
            </div>

            {/* Desktop Title */}
            <div className="hidden lg:block mb-10">
              <h2 className="text-4xl font-bold text-gray-800">
                Welcome Back 👋
              </h2>

              <p className="text-gray-500 mt-3">
                Sign in to continue to your dashboard.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>

              {/* Email */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Email Address
                </label>

                <div className="relative">
                  <i className="fa-regular fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full border border-gray-300 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Password
                </label>

                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full border border-gray-300 rounded-xl py-3.5 pl-12 pr-12 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    <i
                      className={
                        showPassword
                          ? "fa-regular fa-eye-slash"
                          : "fa-regular fa-eye"
                      }
                    ></i>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-sm">
             

                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-lg transition duration-300 shadow-lg hover:shadow-xl"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-gray-500 text-sm">
              © 2026 Social Automation System. All rights reserved.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;