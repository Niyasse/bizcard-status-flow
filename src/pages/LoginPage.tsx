import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserType } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { homeFor, isValidPhone, validateSignup } from "@/lib/auth";
import { userService } from "@/services/admin";
import { isProd } from "@/lib/supabase";
import { Shield, Store, User as UserIcon } from "lucide-react";

type Step = "form" | "otp";

const DEMO_ACCOUNTS = [
  {
    role: "client" as UserType,
    label: "Customer",
    email: "client@b.com",
    phone: "9000000002",
    icon: UserIcon,
    badge: "Browse & Save",
  },
  {
    role: "business" as UserType,
    label: "Business Owner",
    email: "business@b.com",
    phone: "9000000003",
    icon: Store,
    badge: "Manage Shop & Offers",
  },
  {
    role: "admin" as UserType,
    label: "Admin",
    email: "admin@b.com",
    phone: "9000000001",
    icon: Shield,
    badge: "Moderation Panel",
  },
];

const LoginPage = () => {
  const { loginWithOtp, signup, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserType>("client");
  const [otp, setOtp] = useState("123456");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const go = (r: UserType) => navigate(params.get("next") || homeFor(r), { replace: true });

  const requestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const errs: Record<string, string> = mode === "signup"
      ? { ...validateSignup({ name, phone, email, role }) } as Record<string, string>
      : isValidPhone(phone) ? {} : { phone: "Enter a 10-digit mobile number" };

    if (mode === "login" && !isProd && !errs.phone && !userService.findByPhone(cleanPhone)) {
      errs.phone = "No dummy account with this number. Try 9000000002 (Customer), 9000000003 (Owner), or 9000000001 (Admin).";
    }

    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      if (!isProd) setOtp("123456");
      setStep("otp");
    }
  };

  const confirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const u = mode === "signup"
      ? await signup({ name, phone, email, role }, otp)
      : await loginWithOtp(phone, otp);
    setBusy(false);

    if (!u) {
      setErrors({
        otp: isProd ? "Invalid verification code. Please check and try again." : "Invalid code. For development dummy login, use 123456.",
      });
      return;
    }
    go(u.userType);
  };

  const quickLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    if (await login(account.email, "password", account.role)) {
      go(account.role);
    }
  };

  const selectDummyForForm = (account: typeof DEMO_ACCOUNTS[0]) => {
    setPhone(account.phone);
    setEmail(account.email);
    setName(account.label + " User");
    setRole(account.role);
    setErrors({});
  };

  const field = (id: string, label: string, el: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {el}
      {errors[id] && <p id={`${id}-err`} className="text-sm text-destructive">{errors[id]}</p>}
    </div>
  );

  return (
    <AppShell showBottomNav={false}>
      <div className="mx-auto max-w-md bg-card rounded-xl shadow-sm p-5">
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-3" aria-hidden>
            <span className="text-primary-foreground font-bold text-2xl">B</span>
          </div>
          <h1 className="text-xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-sm text-muted-foreground">
            {isProd ? "Sign in with your mobile number" : "Sign in with your mobile number (OTP: 123456)"}
          </p>
        </div>

        <Tabs value={mode} onValueChange={(v) => { setMode(v as typeof mode); setStep("form"); setErrors({}); }}>
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="login" className="min-h-9">Login</TabsTrigger>
            <TabsTrigger value="signup" className="min-h-9">Sign up</TabsTrigger>
          </TabsList>

          {(["login", "signup"] as const).map((m) => (
            <TabsContent key={m} value={m}>
              {step === "form" ? (
                <form onSubmit={requestOtp} className="space-y-4 pt-2" noValidate>
                  {m === "signup" && field("name", "Full name",
                    <Input id="name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={!!errors.name} />)}
                  {field("phone", "Mobile number",
                    <Input id="phone" className="h-11" type="tel" inputMode="numeric" placeholder="e.g. 9000000002" value={phone}
                      onChange={(e) => setPhone(e.target.value)} autoComplete="tel" aria-invalid={!!errors.phone} />)}
                  {m === "signup" && field("email", "Email (optional)",
                    <Input id="email" className="h-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />)}
                  {m === "signup" && (
                    <fieldset className="space-y-1.5">
                      <legend className="text-sm font-medium">I am a</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {([["client", "Customer"], ["business", "Business owner"]] as const).map(([v, l]) => (
                          <Button key={v} type="button" variant={role === v ? "default" : "outline"} className="min-h-11"
                            aria-pressed={role === v} onClick={() => setRole(v)}>{l}</Button>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  <Button type="submit" className="w-full min-h-11">Send OTP</Button>
                </form>
              ) : (
                <form onSubmit={confirmOtp} className="space-y-4 pt-2" noValidate>
                  <p className="text-sm text-muted-foreground">
                    Code sent to <span className="font-medium text-foreground">{phone}</span>.{" "}
                    <button type="button" onClick={() => setStep("form")} className="text-primary underline">Change</button>
                  </p>
                  {!isProd && (
                    <div className="bg-muted/50 p-2.5 rounded-lg text-xs text-muted-foreground text-center">
                      💡 Development Mode OTP: <span className="font-mono font-bold text-foreground">123456</span>
                    </div>
                  )}
                  {field("otp", "6-digit code",
                    <Input id="otp" className="h-11 text-center tracking-widest text-lg font-mono" inputMode="numeric" maxLength={6}
                      value={otp} onChange={(e) => setOtp(e.target.value)} autoFocus aria-invalid={!!errors.otp} />)}
                  <Button type="submit" className="w-full min-h-11" disabled={busy}>{busy ? "Verifying…" : "Verify & continue"}</Button>
                </form>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Development Dummy Accounts Card */}
        {!isProd && (
          <div className="mt-6 pt-5 border-t space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                1-Click Dummy Accounts
              </span>
              <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-mono">
                OTP: 123456
              </span>
            </div>

            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <div
                    key={acc.role}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/60 hover:bg-muted/50 transition-colors cursor-pointer text-left"
                    onClick={() => quickLogin(acc)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-none mb-1 flex items-center gap-2">
                          {acc.label}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({acc.badge})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          📱 {acc.phone} &bull; ✉️ {acc.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        quickLogin(acc);
                      }}
                    >
                      Login
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-center text-muted-foreground">
              Click any row to sign in instantly, or use their phone with OTP <code className="font-mono text-foreground">123456</code>.
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">← Back to discovery</Link>
        </div>
      </div>
    </AppShell>
  );
};

export default LoginPage;
