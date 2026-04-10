import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import logoImg from "@assets/468146293_3917545001849558_7757020803682063832_n-removebg-prev_1772140405610.png";

interface AdminLoginProps {
  onLogin: (user: { id: string; username: string; displayName: string; role: string }) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: username.trim(),
        password,
      });

      if (signInError || !data.user) {
        setError(signInError?.message || "Authentication failed");
        setLoading(false);
        return;
      }

      onLogin({
        id: data.user.id,
        username: data.user.email || username.trim(),
        displayName:
          (data.user.user_metadata?.displayName as string | undefined) ||
          (data.user.email ? data.user.email.split("@")[0] : "Admin"),
        role: "admin",
      });
    } catch (err) {
      console.error("Admin auth request failed", err);
      const message =
        err instanceof Error && err.message
          ? err.message.replace(/^\d+:\s*/, "")
          : "Connection failed. Please try again.";
      setError(message);
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-amber-400 animate-pulse tracking-widest uppercase text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" data-testid="admin-login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoImg} alt="Kebabil" className="h-16 mx-auto mb-4" data-testid="login-logo" />
          <h1 className="text-2xl font-bold text-amber-400 uppercase tracking-[0.3em]" data-testid="login-title">Admin Login</h1>
          <p className="text-neutral-500 text-sm mt-2">
            Sign in to access the admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-neutral-500 mb-1.5 block">Email</label>
            <input
              type="email"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter email"
              className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 focus:border-amber-400 focus:outline-none rounded-none placeholder:text-neutral-600"
              required
              autoFocus
              data-testid="input-email"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-neutral-500 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 focus:border-amber-400 focus:outline-none rounded-none placeholder:text-neutral-600"
              required
              data-testid="input-password"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 text-sm" data-testid="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 text-black py-3 font-bold uppercase tracking-widest text-sm hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-none transition-colors"
            data-testid="button-login"
          >
            {loading ? "Please wait..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/" className="text-neutral-600 text-xs uppercase tracking-wider hover:text-neutral-400 transition-colors" data-testid="link-home">
            ← Back to Website
          </a>
        </div>
      </div>
    </div>
  );
}
