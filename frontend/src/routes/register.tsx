import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";
import { MagneticButton, Panel3D, GlowOrb } from "@/components/landing/atoms";
import { apiClient } from "@/api/client";

export const Route = createFileRoute("/register")({
  ssr: false,
  component: Register,
});

function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiClient.register(name, email, password);
      router.navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-hero opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <GlowOrb color="purple" className="h-[500px] w-[500px] left-[-150px] top-[10%]" />
        <GlowOrb color="cyan" className="h-[420px] w-[420px] right-[-120px] top-[40%]" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Panel3D intensity={6}>
            <div className="glass-strong shadow-elevate p-8">
              <div className="mb-8 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight mb-6"
                >
                  <span
                    className="grid h-6 w-6 place-items-center rounded-md"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    <span className="h-2 w-2 rounded-sm bg-background" />
                  </span>
                  StudentOS
                </Link>
                <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start your AI-powered academic journey
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <div className="glass flex items-center gap-3 px-4 py-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="glass flex items-center gap-3 px-4 py-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="glass flex items-center gap-3 px-4 py-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <MagneticButton type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    "Creating account..."
                  ) : (
                    <>
                      Create account <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </MagneticButton>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link
                  to="/login"
                  className="font-medium hover:text-foreground text-[color:var(--neon-cyan)]"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </Panel3D>
        </motion.div>
      </div>
    </div>
  );
}
