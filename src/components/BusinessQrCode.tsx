import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { profileUrl } from "@/components/BusinessCard";

/** Scannable QR linking to the business profile, downloadable as PNG. */
export function BusinessQrCode({ id, name }: { id: string; name: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const url = profileUrl(id);
  const download = () => {
    const canvas = wrap.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${name.replace(/\W+/g, "-").toLowerCase()}-qr.png`;
    a.click();
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={wrap} className="bg-card p-3 rounded-lg border">
        <QRCodeCanvas value={url} size={200} marginSize={2} />
      </div>
      <p className="text-xs text-muted-foreground break-all text-center">{url}</p>
      <Button variant="outline" onClick={download}><Download className="w-4 h-4 mr-2" />Download QR</Button>
    </div>
  );
}
