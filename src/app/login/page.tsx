"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Beaker, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/showroom";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("Email ou mot de passe incorrect");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Veuillez confirmer votre email avant de vous connecter");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Successful login - redirect
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 backdrop-blur-xl">
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-neutral-300">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              id="email"
              type="email"
              placeholder="vous@supermedia.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className={cn(
                "border-white/10 bg-white/5 pl-10 text-white placeholder:text-neutral-500",
                "focus:border-violet-500 focus:ring-violet-500/20"
              )}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-neutral-300">
            Mot de passe
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className={cn(
                "border-white/10 bg-white/5 pl-10 text-white placeholder:text-neutral-500",
                "focus:border-violet-500 focus:ring-violet-500/20"
              )}
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-6 border-t border-white/5 pt-4">
        <p className="text-center text-xs text-neutral-500">
          Accès réservé aux membres de Supermedia.
          <br />
          Contactez un administrateur pour obtenir un compte.
        </p>
      </div>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 backdrop-blur-xl">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-12 animate-pulse rounded bg-white/10" />
          <div className="h-10 animate-pulse rounded-md bg-white/5" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
          <div className="h-10 animate-pulse rounded-md bg-white/5" />
        </div>
        <div className="h-10 animate-pulse rounded-md bg-violet-600/50" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-4">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
            <Beaker className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Supermedia Lab
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Connectez-vous pour accéder à la plateforme
          </p>
        </div>

        {/* Login Card wrapped in Suspense */}
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
