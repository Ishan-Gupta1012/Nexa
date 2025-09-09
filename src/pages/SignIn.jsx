import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import nexaGenLogo from "../assets/logo.png"; // Ensure you have a logo image in the assets folder

const GoogleIcon = () => (
  <svg
    className="h-5 w-5 mr-2"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25C22.56 11.47 22.5 10.7 22.36 9.95H12V14.26H18.14C17.89 15.63 17.15 16.81 16.05 17.59V20.25H20C21.73 18.52 22.56 15.82 22.56 12.25Z"
      fill="#4285F4"
    />
    <path
      d="M12 23C15.24 23 17.95 21.92 20 20.25L16.05 17.59C14.95 18.37 13.58 18.81 12 18.81C9.13 18.81 6.69 16.99 5.84 14.53H1.72V17.31C3.55 20.67 7.45 23 12 23Z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.53C5.62 13.86 5.5 13.14 5.5 12.39C5.5 11.64 5.62 10.92 5.84 10.25V7.47H1.72C0.94 9.02 0.5 10.65 0.5 12.39C0.5 14.13 0.94 15.76 1.72 17.31L5.84 14.53Z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.98C13.72 5.98 15.19 6.57 16.35 7.65L20.08 3.92C17.95 1.96 15.24 1 12 1C7.45 1 3.55 3.33 1.72 7.47L5.84 10.25C6.69 7.79 9.13 5.98 12 5.98Z"
      fill="#EA4335"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleEmailPasswordAuth = async (isSignUpFlow) => {
    setLoading(true);
    try {
      const authFunction = isSignUpFlow
        ? supabase.auth.signUp
        : supabase.auth.signInWithPassword;
      const { error } = await authFunction({ email, password });
      if (error) throw error;

      if (isSignUpFlow) {
        alert(
          "Account created! Please check your email to confirm your account."
        );
        setIsSignUp(false);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with GitHub:", error);
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white relative overflow-hidden p-4">
      <div className="absolute top-0 -left-1/4 w-full h-full bg-purple-600 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 -right-1/4 w-full h-full bg-emerald-600 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 flex w-full max-w-5xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden min-h-[550px]">
        <div
          className="hidden lg:flex lg:w-1/2 bg-cover bg-center flex-col justify-center items-center p-10 relative"
          style={{ backgroundColor: "#211E30" }}
        >
          <div
            className="hidden lg:flex lg:w-1/2 bg-cover bg-center flex-col justify-center items-center p-10 relative"
            style={{ backgroundColor: "#211E30" }}
          >
            <div className="w-96 h-96 flex items-center justify-center">
              <img
                src={nexaGenLogo}
                alt="NexaGen AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? "Create an account" : "Sign In"}
          </h1>
          <p className="text-gray-400 mb-6">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-emerald-400 hover:underline"
            >
              {isSignUp ? "Log In" : "Sign Up"}
            </button>
          </p>

          <div className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <UserIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="First Name"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500 transition-colors"
                  />
                </div>
                <div className="relative">
                  <UserIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {isSignUp && (
              <div className="flex items-center mt-2">
                <input
                  id="terms"
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-400">
                  I agree to the{" "}
                  <span className="text-emerald-400 hover:underline cursor-pointer">
                    Terms & Conditions
                  </span>
                </label>
              </div>
            )}

            <button
              onClick={() => handleEmailPasswordAuth(isSignUp)}
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-semibold text-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                ? "Create account"
                : "Sign In"}
            </button>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700"></span>
            </div>
            <div className="relative bg-gray-800 px-4 text-sm text-gray-400">
              Or {isSignUp ? "sign up" : "sign in"} with
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex-1 flex justify-center items-center py-3 px-4 border border-gray-700 rounded-lg text-white font-medium bg-gray-700/50 hover:bg-gray-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <GoogleIcon /> Google
            </button>
            <button
              onClick={handleGitHubSignIn}
              disabled={loading}
              className="flex-1 flex justify-center items-center py-3 px-4 border border-gray-700 rounded-lg text-white font-medium bg-gray-700/50 hover:bg-gray-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <GitHubIcon /> GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
