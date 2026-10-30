import { describe, it, expect } from "vitest";
import type { BusinessUpdate } from "@/types";
import {
  canPublish, validateUpdate, unreadUpdates, notifications, makeReferenceId, whatsAppEnquiryUrl, qrLink, detectPlatform,
} from "./engagement";

const NOW = new Date("2026-10-30T12:00:00Z").getTime();
const at = (h: number) => new Date(NOW + h * 3600_000).toISOString();
const u = (id: string, companyId: string, h = 5): BusinessUpdate =>
  ({ id, companyId, companyName: companyId, companyLogo: "", content: "x", postedAt: at(-1), expiresAt: at(h) });

describe("max 3 active updates", () => {
  it("allows publishing with 2 active", () => expect(canPublish([u("1", "m"), u("2", "m")], undefined, NOW)).toBe(true));
  it("blocks a 4th active update", () => expect(canPublish([u("1", "m"), u("2", "m"), u("3", "m")], undefined, NOW)).toBe(false));
  it("expired updates don't count", () => expect(canPublish([u("1", "m"), u("2", "m"), u("3", "m", -1)], undefined, NOW)).toBe(true));
  it("editing one of 3 active is allowed", () => expect(canPublish([u("1", "m"), u("2", "m"), u("3", "m")], "2", NOW)).toBe(true));
});

describe("update validation", () => {
  const ok = { content: "Sale", linkUrl: "", linkTitle: "", expiresAt: at(24) };
  it("accepts a valid update", () => expect(validateUpdate(ok, NOW)).toEqual({}));
  it("rejects past expiry", () => expect(validateUpdate({ ...ok, expiresAt: at(-1) }, NOW).expiresAt).toBeTruthy());
  it("rejects non-http link", () => expect(validateUpdate({ ...ok, linkUrl: "instagram.com/x" }, NOW).linkUrl).toBeTruthy());
  it("rejects over 200 chars", () => expect(validateUpdate({ ...ok, content: "a".repeat(201) }, NOW).content).toBeTruthy());
  it("detects instagram", () => expect(detectPlatform("https://www.instagram.com/x")).toBe("instagram"));
});

describe("following & notifications", () => {
  const all = [u("a", "b1"), u("b", "b2"), u("c", "b3"), u("d", "b1", -2)];
  const s = { savedIds: ["b1", "b2", "b3"], mutedIds: ["b3"], alertsOffIds: ["b2"], readIds: [] as string[] };
  it("unread = active, saved, unmuted, not read", () => expect(unreadUpdates(all, s, NOW).map((x) => x.id)).toEqual(["a", "b"]));
  it("read updates are no longer unread", () => expect(unreadUpdates(all, { ...s, readIds: ["a"] }, NOW).map((x) => x.id)).toEqual(["b"]));
  it("alerts off suppresses notifications", () => expect(notifications(all, s, NOW).map((x) => x.id)).toEqual(["a"]));
});

describe("enquiries & QR", () => {
  it("reference id format", () => expect(makeReferenceId("b1", () => 0)).toBe("BZ-B1-AAAAAA"));
  it("prefilled WhatsApp message carries the ref", () =>
    expect(decodeURIComponent(whatsAppEnquiryUrl("919847012345", "Kochi Bake", "BZ-B1-X"))).toContain("Bizapp ref: BZ-B1-X"));
  it("permanent QR link", () => expect(qrLink("https://x.app", "b1")).toBe("https://x.app/profile/b1?src=qr"));
});
