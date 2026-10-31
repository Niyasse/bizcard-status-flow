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
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Step = "form" | "otp";

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
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const go = (r: UserType) => navigate(params.get("next") || homeFor(r), { replace: true });

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const errs: Record<string, string> = mode === "signup"
      ? { ...validateSignup({ name, phone, email, role }) } as Record<string, string>
      : isValidPhone(phone) ? {} : { phone: "Enter a 10-digit mobile number" };

    if (!isSupabaseConfigured() && mode === "login" && !errs.phone && !userService.findByPhone(cleanPhone)) {
      errs.phone = "No account with this number. Sign up instead.";
    }

    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      if (isSupabaseConfigured()) {
        try {
          const { error } = await supabase.auth.signInWithOtp({
            phone: `+91${cleanPhone}`,
          });
          if (error) {
            setErrors({ phone: error.message });
            return;
          }
        } catch (err: any) {
          setErrors({ phone: err.message || "Failed to send OTP" });
          return;
        }
      }
      setOtp("");
      setStep("otp");
    }
  };

  const confirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const u = mode === "signup" ? await signup({ name, phone, email, role }, otp) : await loginWithOtp(phone, otp);
    setBusy(false);
    if (!u) {
      setErrors({
        otp: isSupabaseConfigured()
          ? "Invalid or expired OTP code. Please try again."
          : "Wrong code. For this demo use 123456.",
      });
      return;
    }
    go(u.userType);
  };

  const demo = async (r: UserType, mail: string) => { if (await login(mail, "password", r)) go(r); };

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
          <p className="text-sm text-muted-foreground">Sign in with your mobile number</p>
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
                    <Input id="phone" className="h-11" type="tel" inputMode="numeric" placeholder="98765 43210" value={phone}
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
                  {field("otp", "6-digit code",
                    <Input id="otp" className="h-11 text-center tracking-widest text-lg font-mono" inputMode="numeric" maxLength={6}
                      value={otp} onChange={(e) => setOtp(e.target.value)} autoFocus aria-invalid={!!errors.otp} />)}
                  <Button type="submit" className="w-full min-h-11" disabled={busy}>{busy ? "Verifying…" : "Verify & continue"}</Button>
                </form>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 pt-5 border-t text-center space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Demo accounts (click to sign in)</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button type="button" variant="outline" size="sm" onClick={() => demo("client", "client@b.com")}>Customer</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => demo("business", "business@b.com")}>Owner</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => demo("admin", "admin@b.com")}>Admin</Button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">← Back to discovery</Link>
        </div>
      </div>
    </AppShell>
  );
};

export default LoginPage;
