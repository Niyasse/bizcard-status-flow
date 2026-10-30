import { describe, it, expect } from "vitest";
import { canAccess, defaultListingStatus, homeFor, isPublicListing, isValidPhone, validateSignup, verifyOtp } from "./auth";

describe("auth rules", () => {
  it("accepts only the demo OTP 123456", () => {
    expect(verifyOtp("123456")).toBe(true);
    expect(verifyOtp("000000")).toBe(false);
  });
  it("validates 10-digit Indian mobiles, with or without +91", () => {
    expect(isValidPhone("9876543210")).toBe(true);
    expect(isValidPhone("+91 98765 43210")).toBe(true);
    expect(isValidPhone("1234567890")).toBe(false);
  });
  it("sends each role to its home", () => {
    expect(homeFor("client")).toBe("/");
    expect(homeFor("business")).toBe("/dashboard");
    expect(homeFor("admin")).toBe("/admin");
  });
  it("blocks customers from admin and business areas, lets admin in everywhere", () => {
    expect(canAccess("client", ["admin"])).toBe(false);
    expect(canAccess("client", ["business"])).toBe(false);
    expect(canAccess("business", ["business"])).toBe(true);
    expect(canAccess("admin", ["business"])).toBe(true);
    expect(canAccess(null, ["client"])).toBe(false);
  });
  it("rejects admin signup", () => {
    expect(validateSignup({ name: "A B", phone: "9876543210", email: "", role: "admin" }).role).toBeTruthy();
  });
});

describe("moderation rules", () => {
  it("only approved listings are public", () => {
    expect(isPublicListing("approved")).toBe(true);
    expect(isPublicListing("pending")).toBe(false);
    expect(isPublicListing("rejected")).toBe(false);
    expect(isPublicListing("hidden")).toBe(false);
  });
  it("new owner businesses start pending, seeded ones approved", () => {
    expect(defaultListingStatus(true)).toBe("pending");
    expect(defaultListingStatus(false)).toBe("approved");
  });
});
