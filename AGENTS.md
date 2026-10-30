# Frontend rules
- Keep typed Kerala fixtures behind the service layer; pages consume hooks or services, so future backend replacement does not change presentation.
- Customer wallet and recent-search state use versioned localStorage through services; this demo has no backend or real authentication.
- Customer pages share AppShell and BottomNav; legacy owner/admin routes remain separate to avoid expanding the sprint.
- Search and operating-hours rules are pure functions with deterministic tests; operating hours use Asia/Kolkata rather than the device timezone.