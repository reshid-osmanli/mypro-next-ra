// ============================================================================
// vitest.setup.ts — Test setup
// ----------------------------------------------------------------------------
// New file (root): /vitest.setup.ts
// ============================================================================

import "@testing-library/jest-dom/vitest";
import { vi, beforeEach, afterEach } from "vitest";

// Stable secret for tests
process.env.AUTH_SECRET ??= "test-secret-32-characters-long-please";
process.env.ADMIN_SESSION_SECRET ??= "admin-test-secret-32-characters-please";
process.env.NEXTAUTH_SECRET ??= process.env.AUTH_SECRET;

// Stub next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Stub next-auth
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Stub crypto.randomBytes for stable tests
beforeEach(() => {
  vi.spyOn(crypto, "randomBytes").mockImplementation((size: number) => Buffer.alloc(size, 0xab));
});

afterEach(() => {
  vi.restoreAllMocks();
});
