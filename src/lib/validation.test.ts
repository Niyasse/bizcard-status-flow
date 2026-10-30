import { describe, it, expect } from "vitest";
import { isValidPhone, validateLogoFile, validateStep, toWhatsAppId, type BusinessForm } from "./validation";

const base: BusinessForm = {
  name: "Test", tagline: "t", phone: "98470 12345", whatsapp: "", email: "a@b.in", website: "",
  address: "x", districtId: "ekm", localityId: "kakkanad", categoryIds: ["bakery"], services: "",
  logo: "", template: "default", orientation: "landscape", facebook: "", instagram: "", linkedin: "", youtube: "",
};

describe("registration validation", () => {
  it("accepts Indian mobile formats and rejects bad ones", () => {
    expect(isValidPhone("+91 98470 12345")).toBe(true);
    expect(isValidPhone("09847012345")).toBe(true);
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("5847012345")).toBe(false);
  });
  it("limits logo to 1 MB images", () => {
    expect(validateLogoFile({ size: 1024 * 1024, type: "image/png" })).toBeNull();
    expect(validateLogoFile({ size: 1024 * 1024 + 1, type: "image/png" })).toMatch(/1 MB/);
    expect(validateLogoFile({ size: 10, type: "application/pdf" })).toMatch(/image/);
  });
  it("requires name, phone and email on step 1", () => {
    const e = validateStep(0, { ...base, name: "", phone: "", email: "" });
    expect(Object.keys(e).sort()).toEqual(["email", "name", "phone"]);
    expect(validateStep(0, base)).toEqual({});
  });
  it("requires location and a category on step 2", () => {
    const e = validateStep(1, { ...base, districtId: "", localityId: "", categoryIds: [] });
    expect(e.districtId && e.localityId && e.categoryIds).toBeTruthy();
  });
  it("builds WhatsApp id with country code", () => {
    expect(toWhatsAppId("98470 12345")).toBe("919847012345");
  });
});
