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
            <div className="glass-strong shadow-elevate p-8 text-center">
              <div className="mb-6">
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
                <h1 className="text-3xl font-semibold tracking-tight">Public Sign-Up Closed</h1>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  To maintain system integrity and proper Role-Based Access Control (RBAC), public user registration is disabled in StudentOS.
                </p>
              </div>

              <div className="my-6 p-4 rounded-xl border border-white/5 bg-white/2 text-left space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-neon-cyan">Hierarchy Flow</div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Accounts must be created hierarchically:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Super Admins manage Admin accounts.</li>
                    <li>Admins manage Teacher accounts.</li>
                    <li>Teachers register Student accounts.</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Please contact your course instructor or school administrator to register your StudentOS credentials.
              </p>

              <Link to="/login" className="inline-block w-full">
                <MagneticButton className="w-full">
                  Return to Sign In <ArrowRight className="h-4 w-4" />
                </MagneticButton>
              </Link>
            </div>
          </Panel3D>
        </motion.div>
      </div>
    </div>
  );
}
