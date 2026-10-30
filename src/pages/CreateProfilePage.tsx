import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BusinessCard } from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useDistricts, useLocalities, useMyBusiness, useTemplates } from "@/hooks/use-data";
import { myBusinessService, MY_BUSINESS_ID } from "@/services";
import { validateStep, validateLogoFile, toWhatsAppId, type BusinessForm, type Errors } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { CardTemplateId } from "@/types";

const STEPS = ["Business details", "Location & category", "Card design"];
const empty: BusinessForm = {
  name: "", tagline: "", phone: "", whatsapp: "", email: "", website: "", address: "", districtId: "",
  localityId: "", categoryIds: [], services: "", logo: "", template: "default", orientation: "landscape",
  facebook: "", instagram: "", linkedin: "", youtube: "",
};

function Field({ id, label, error, children, optional }: { id: string; label: string; error?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{optional && <span className="text-muted-foreground font-normal"> (optional)</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

const CreateProfilePage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: existing, isLoading } = useMyBusiness();
  const { data: districts = [] } = useDistricts();
  const { data: categories = [] } = useCategories();
  const { data: templates = [] } = useTemplates();
  const [f, setF] = useState<BusinessForm>(empty);
  const { data: localities = [] } = useLocalities(f.districtId || undefined);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setF({
      name: existing.name, tagline: existing.tagline, phone: existing.phone, whatsapp: existing.whatsapp ?? "",
      email: existing.email, website: existing.website ?? "", address: existing.address, districtId: existing.districtId,
      localityId: existing.localityId, categoryIds: existing.categoryIds, services: (existing.services ?? []).join(", "),
      logo: existing.logo, template: existing.template, orientation: existing.orientation,
      facebook: existing.social?.facebook ?? "", instagram: existing.social?.instagram ?? "",
      linkedin: existing.social?.linkedin ?? "", youtube: existing.social?.youtube ?? "",
    });
  }, [existing]);

  const set = <K extends keyof BusinessForm>(k: K, v: BusinessForm[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateLogoFile(file);
    if (err) { setErrors((x) => ({ ...x, logo: err })); e.target.value = ""; return; }
    const r = new FileReader();
    r.onload = () => set("logo", r.result as string);
    r.readAsDataURL(file);
  };

  const next = () => {
    const e = validateStep(step, f);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => s + 1);
  };

  const save = async () => {
    const e = validateStep(2, f);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const social = Object.fromEntries((["facebook", "instagram", "linkedin", "youtube"] as const).filter((k) => f[k].trim()).map((k) => [k, f[k].trim()]));
    try {
      await myBusinessService.save({
        name: f.name.trim(), tagline: f.tagline.trim(), phone: f.phone.trim(),
        whatsapp: toWhatsAppId(f.whatsapp.trim() || f.phone), email: f.email.trim(),
        website: f.website.trim() || undefined, address: f.address.trim(), districtId: f.districtId,
        localityId: f.localityId, categoryIds: f.categoryIds,
        services: f.services.split(",").map((s) => s.trim()).filter(Boolean),
        logo: f.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=128C7E&color=fff`,
        social, template: f.template as CardTemplateId, orientation: f.orientation, ownerId: undefined,
      });
      await qc.invalidateQueries();
      toast({ title: existing ? "Card updated" : "Business card created" });
      navigate("/dashboard");
    } catch {
      toast({ title: "Could not save", description: "Your device storage may be full. Try a smaller logo.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (isLoading) return <AppShell><p className="text-center text-muted-foreground py-8">Loading…</p></AppShell>;

  const previewLogo = f.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name || "B")}&background=128C7E&color=fff`;

  return (
    <AppShell>
      <PageHeader title={existing ? "Edit business card" : "Register your business"} subtitle={`Step ${step + 1} of 3 · ${STEPS[step]}`} backTo="/dashboard" />

      <ol className="flex gap-2 mb-5" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
            <span className={cn("text-[11px] mt-1 block truncate", i === step ? "text-primary font-medium" : "text-muted-foreground")}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="bg-card rounded-xl p-4 shadow-sm space-y-4">
        {step === 0 && (
          <>
            <Field id="logo" label="Logo" error={errors.logo} optional>
              <div className="flex items-center gap-3">
                <img src={previewLogo} alt="Logo preview" className="w-14 h-14 rounded-full object-cover border" />
                <input id="logo" type="file" accept="image/*" onChange={onLogo} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("logo")?.click()}>
                  <Upload className="w-4 h-4 mr-2" />Upload (max 1 MB)
                </Button>
              </div>
            </Field>
            <Field id="name" label="Business name" error={errors.name}>
              <Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Kochi Bake House" />
            </Field>
            <Field id="tagline" label="Short description" error={errors.tagline}>
              <Input id="tagline" value={f.tagline} maxLength={80} onChange={(e) => set("tagline", e.target.value)} placeholder="Plum cakes & Kerala snacks" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="phone" label="Phone" error={errors.phone}>
                <Input id="phone" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98470 12345" />
              </Field>
              <Field id="whatsapp" label="WhatsApp" error={errors.whatsapp} optional>
                <Input id="whatsapp" type="tel" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="Same as phone" />
              </Field>
            </div>
            <Field id="email" label="Email" error={errors.email}>
              <Input id="email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field id="website" label="Website" error={errors.website} optional>
              <Input id="website" value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
            </Field>
            <Field id="services" label="Services / products" optional>
              <Input id="services" value={f.services} onChange={(e) => set("services", e.target.value)} placeholder="Cakes, Catering, Home delivery" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              {(["instagram", "facebook", "linkedin", "youtube"] as const).map((k) => (
                <Field key={k} id={k} label={k[0].toUpperCase() + k.slice(1)} error={errors[k]} optional>
                  <Input id={k} value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder="https://" />
                </Field>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Field id="district" label="District" error={errors.districtId}>
              <Select value={f.districtId} onValueChange={(v) => { set("districtId", v); set("localityId", ""); }}>
                <SelectTrigger id="district"><SelectValue placeholder="Select district" /></SelectTrigger>
                <SelectContent>{districts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field id="locality" label="Town / locality" error={errors.localityId}>
              <Select value={f.localityId} onValueChange={(v) => set("localityId", v)} disabled={!f.districtId}>
                <SelectTrigger id="locality"><SelectValue placeholder={f.districtId ? "Select town" : "Pick a district first"} /></SelectTrigger>
                <SelectContent>{localities.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field id="address" label="Full address" error={errors.address}>
              <Textarea id="address" value={f.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field id="cats" label="Categories" error={errors.categoryIds}>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const on = f.categoryIds.includes(c.id);
                  return (
                    <button key={c.id} type="button" aria-pressed={on}
                      onClick={() => set("categoryIds", on ? f.categoryIds.filter((x) => x !== c.id) : [...f.categoryIds, c.id])}
                      className={cn("px-3 py-1.5 rounded-full text-sm border", on ? "bg-primary text-primary-foreground border-primary" : "bg-background")}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field id="orientation" label="Orientation">
              <div className="flex gap-2">
                {(["landscape", "portrait"] as const).map((o) => (
                  <Button key={o} type="button" size="sm" variant={f.orientation === o ? "default" : "outline"} onClick={() => set("orientation", o)}>
                    {o[0].toUpperCase() + o.slice(1)}
                  </Button>
                ))}
              </div>
            </Field>
            <Field id="template" label="Design" error={errors.template}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templates.map((t) => (
                  <button key={t.id} type="button" onClick={() => set("template", t.id)} aria-pressed={f.template === t.id}
                    className={cn("relative text-left p-3 rounded-lg border", f.template === t.id ? "border-primary ring-2 ring-primary/30" : "")}>
                    <span className="font-medium text-sm block">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.description}</span>
                    {f.template === t.id && <Check className="w-4 h-4 text-primary absolute top-2 right-2" />}
                  </button>
                ))}
              </div>
            </Field>
            <div>
              <Label>Preview</Label>
              <BusinessCard id={existing?.id ?? MY_BUSINESS_ID} name={f.name} logo={previewLogo} tagline={f.tagline} phone={f.phone}
                email={f.email} website={f.website || undefined} address={f.address}
                services={f.services.split(",").map((s) => s.trim()).filter(Boolean)}
                template={f.template as CardTemplateId} orientation={f.orientation} />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          {step > 0 && <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>}
          {step < 2
            ? <Button type="button" className="flex-1" onClick={next}>Next</Button>
            : <Button type="button" className="flex-1" onClick={save} disabled={saving}>{saving ? "Saving…" : existing ? "Save changes" : "Create card"}</Button>}
        </div>
      </div>
    </AppShell>
  );
};

export default CreateProfilePage;
