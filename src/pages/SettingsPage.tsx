import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/components/ThemeProvider";
import { isValidPhone } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user, updateProfile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [err, setErr] = useState("");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setErr("Enter your name");
    if (phone && !isValidPhone(phone)) return setErr("Enter a 10-digit mobile number");
    setErr("");
    updateProfile({ name: name.trim(), email: email.trim(), phone });
    toast({ title: "Profile saved" });
  };

  return (
    <AppShell>
      <PageHeader title={t("settings")} backTo="/" />
      <div className="space-y-4">
        {user && (
          <form onSubmit={save} className="bg-card rounded-xl p-4 shadow-sm space-y-3" noValidate>
            <h2 className="font-semibold">Edit profile <span className="text-xs text-muted-foreground capitalize">({user.userType === "client" ? "customer" : user.userType})</span></h2>
            <div className="space-y-1.5"><Label htmlFor="s-name">Name</Label><Input id="s-name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="s-phone">Mobile</Label><Input id="s-phone" className="h-11" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="s-email">Email</Label><Input id="s-email" className="h-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
            <Button type="submit" className="min-h-11 w-full">Save profile</Button>
          </form>
        )}

        <section className="bg-card rounded-xl p-4 shadow-sm space-y-2" aria-labelledby="lang-h">
          <h2 id="lang-h" className="font-semibold">{t("language")}</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={language === "en" ? "default" : "outline"} className="min-h-11" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</Button>
            <Button variant={language === "ml" ? "default" : "outline"} className="min-h-11" aria-pressed={language === "ml"} onClick={() => setLanguage("ml")}>മലയാളം</Button>
          </div>
        </section>

        <section className="bg-card rounded-xl p-4 shadow-sm space-y-2" aria-labelledby="theme-h">
          <h2 id="theme-h" className="font-semibold">Appearance</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={theme !== "dark" ? "default" : "outline"} className="min-h-11" aria-pressed={theme !== "dark"} onClick={() => setTheme("light")}>Light</Button>
            <Button variant={theme === "dark" ? "default" : "outline"} className="min-h-11" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dark</Button>
          </div>
        </section>

        {user ? (
          <Button variant="outline" className="w-full min-h-11 text-destructive" onClick={() => { logout(); navigate("/"); }}>{t("logout")}</Button>
        ) : (
          <Button className="w-full min-h-11" onClick={() => navigate("/login")}>{t("login")}</Button>
        )}
      </div>
    </AppShell>
  );
};

export default SettingsPage;
