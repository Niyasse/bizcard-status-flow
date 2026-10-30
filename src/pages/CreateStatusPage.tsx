import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Clock, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMyBusiness, useOwnUpdates } from "@/hooks/use-data";
import { ownUpdateService } from "@/services";
import { useToast } from "@/hooks/use-toast";
import {
  canPublish, isActive, validateUpdate, MAX_ACTIVE_UPDATES, MAX_UPDATE_CHARS, type UpdateForm, type UpdateErrors,
} from "@/lib/engagement";

const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const blank = (): UpdateForm => ({ content: "", linkUrl: "", linkTitle: "", expiresAt: toLocalInput(new Date(Date.now() + 86400_000)) });

const CreateStatusPage = () => {
  const { data: biz, isLoading } = useMyBusiness();
  const own = useOwnUpdates();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<UpdateForm | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [errors, setErrors] = useState<UpdateErrors>({});

  if (isLoading) return <AppShell><p className="text-center text-muted-foreground py-8">Loading…</p></AppShell>;
  if (!biz) {
    return (
      <AppShell>
        <PageHeader title="Manage updates" backTo="/dashboard" />
        <div className="bg-card rounded-xl p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground mb-4">Register your business first to post offers.</p>
          <Button asChild><Link to="/create-profile">Register business</Link></Button>
        </div>
      </AppShell>
    );
  }

  const activeCount = own.filter((u) => isActive(u)).length;
  const allowed = canPublish(own, editingId);
  const set = (k: keyof UpdateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => f && { ...f, [k]: e.target.value });

  const startNew = () => { setEditingId(undefined); setErrors({}); setForm(blank()); };
  const startEdit = (id: string) => {
    const u = own.find((x) => x.id === id)!;
    setEditingId(id); setErrors({});
    setForm({ content: u.content, linkUrl: u.link?.url ?? "", linkTitle: u.link?.title ?? "", expiresAt: toLocalInput(new Date(u.expiresAt)) });
  };
  const refresh = () => qc.invalidateQueries({ queryKey: ["updates"] });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const errs = validateUpdate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!allowed) { toast({ title: `Maximum ${MAX_ACTIVE_UPDATES} active updates`, description: "Delete or wait for one to expire." }); return; }
    ownUpdateService.save(biz, form, editingId);
    refresh();
    toast({ title: editingId ? "Update saved" : "Update published", description: "Followers will see it in Updates." });
    setForm(null); setEditingId(undefined);
  };
  const remove = (id: string) => {
    if (!confirm("Delete this update?")) return;
    ownUpdateService.remove(id); refresh();
    if (editingId === id) setForm(null);
  };

  return (
    <AppShell>
      <PageHeader title="Manage updates" subtitle={`${activeCount} of ${MAX_ACTIVE_UPDATES} active`} backTo="/dashboard"
        actions={!form && (
          <Button size="sm" onClick={startNew} disabled={!canPublish(own)}><Plus className="w-4 h-4 mr-1" />New</Button>
        )} />
      {!form && !canPublish(own) && (
        <p className="text-xs text-muted-foreground mb-3">You have {MAX_ACTIVE_UPDATES} active updates. Delete one to post another.</p>
      )}

      {form && (
        <form onSubmit={submit} className="bg-card rounded-xl p-4 shadow-sm mb-4 space-y-3" noValidate>
          <h2 className="font-bold">{editingId ? "Edit update" : "New update"}</h2>
          <div>
            <Label htmlFor="content">Offer / update</Label>
            <Textarea id="content" rows={3} value={form.content} onChange={set("content")} maxLength={MAX_UPDATE_CHARS + 20}
              placeholder="e.g. 20% off on all cakes this weekend" />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-destructive">{errors.content}</span>
              <span className="text-muted-foreground">{form.content.trim().length}/{MAX_UPDATE_CHARS}</span>
            </div>
          </div>
          <div>
            <Label htmlFor="linkUrl">Link (optional)</Label>
            <Input id="linkUrl" value={form.linkUrl} onChange={set("linkUrl")} placeholder="https://instagram.com/yourpage" />
            {errors.linkUrl && <p className="text-xs text-destructive mt-1">{errors.linkUrl}</p>}
          </div>
          {form.linkUrl.trim() && (
            <div>
              <Label htmlFor="linkTitle">Link text (optional)</Label>
              <Input id="linkTitle" value={form.linkTitle} onChange={set("linkTitle")} placeholder="See on Instagram" />
            </div>
          )}
          <div>
            <Label htmlFor="expiresAt">Expires on</Label>
            <Input id="expiresAt" type="datetime-local" value={form.expiresAt} onChange={set("expiresAt")} />
            {errors.expiresAt && <p className="text-xs text-destructive mt-1">{errors.expiresAt}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">{editingId ? "Save changes" : "Publish"}</Button>
            <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button>
          </div>
        </form>
      )}

      <h2 className="text-sm font-bold text-muted-foreground mb-2">Your updates</h2>
      {own.length ? own.map((u) => {
        const active = isActive(u);
        return (
          <article key={u.id} className="bg-card rounded-lg shadow-sm p-3 mb-2">
            <p className="text-sm">{u.content}</p>
            {u.link && <p className="text-xs text-primary mt-1 flex items-center gap-1"><ExternalLink className="w-3 h-3" />{u.link.title}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />{active ? `Until ${new Date(u.expiresAt).toLocaleString()}` : "Expired"}
              </span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" aria-label="Edit update" onClick={() => startEdit(u.id)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Delete update" onClick={() => remove(u.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          </article>
        );
      }) : <div className="bg-card rounded-lg p-6 text-center text-sm text-muted-foreground">No updates yet. Tap New to post an offer.</div>}
    </AppShell>
  );
};

export default CreateStatusPage;
