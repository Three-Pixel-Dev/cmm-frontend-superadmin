import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { CUSTOMER_APP_URL } from "@/lib/app-url";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { authApi } from "@/lib/admin/api";
import { SECTION_PATHS } from "@/lib/admin/nav";
import { invalidateSessionBootstrap } from "@/lib/admin/sessionBootstrap";
import { useAuth } from "@/store/useAuth";

export function AdminLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const loginM = useMutation({
    mutationFn: () => authApi.login(email.trim(), password),
    onSuccess: (res) => {
      const role = (res.user.role_name ?? "").toLowerCase();
      if (role !== "super_admin") {
        setError(
          "Use email and password for superadmin only. Room hosts sign in from the game app.",
        );
        return;
      }
      invalidateSessionBootstrap();
      queryClient.clear();
      setSession(res.user);
      toast.success(`Welcome back, ${res.user.name}`);
      void navigate({ to: SECTION_PATHS.home, replace: true });
    },
    onError: (e: Error) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    loginM.mutate();
  };

  const invalid = !!error;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo
            variant="full"
            subtitle="Admin Control Panel"
            className="flex flex-col items-center [&_img]:mx-auto [&_img]:object-center"
          />
          <h1 id="admin-login-title" className="sr-only">
            SuperCash Admin
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Sign in to the control panel</p>
        </div>

        <form
          onSubmit={submit}
          aria-labelledby="admin-login-title"
          noValidate
          className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="admin-email"
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-invalid={invalid}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cmm.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                aria-invalid={invalid}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-pressed={showPw}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={loginM.isPending}
            aria-busy={loginM.isPending}
          >
            {loginM.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a
            href={CUSTOMER_APP_URL}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to SuperCash
          </a>
        </div>
      </div>
    </main>
  );
}
