import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import logoImg from "@assets/468146293_3917545001849558_7757020803682063832_n-removebg-prev_1772140405610.png";

interface AdminLoginProps {
  onLogin: (user: { id: number; username: string; displayName: string; role: string }) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/needs-setup")
      .then(r => r.json())
      .then(d => setNeedsSetup(d.needsSetup))
      .catch(() => setNeedsSetup(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = needsSetup ? "/api/auth/setup" : "/api/auth/login";
      const body = needsSetup
        ? { username, password, displayName }
        : { username, password };

      const res = await apiRequest("POST", endpoint, body);
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Authentication failed");
        setLoading(false);
        return;
      }
      const user = await res.json();
      onLogin(user);
    } catch {
      setError("Connection failed. Please try again.");
    }
    setLoading(false);
  };

  if (needsSetup === null) {
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
          <h1 className="text-2xl font-bold text-amber-400 uppercase tracking-[0.3em]" data-testid="login-title">
            {needsSetup ? "Admin Setup" : "Admin Login"}
          </h1>
          <p className="text-neutral-500 text-sm mt-2">
            {needsSetup
              ? "Create your owner account to get started"
              : "Sign in to access the admin dashboard"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {needsSetup && (
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500 mb-1.5 block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Restaurant Owner"
                className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 focus:border-amber-400 focus:outline-none rounded-none placeholder:text-neutral-600"
                required
                data-testid="input-display-name"
              />
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-widest text-neutral-500 mb-1.5 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 focus:border-amber-400 focus:outline-none rounded-none placeholder:text-neutral-600"
              required
              autoFocus
              data-testid="input-username"
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
            {loading ? "Please wait..." : needsSetup ? "Create Account & Enter" : "Sign In"}
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
