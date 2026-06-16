import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Stable secrets for tests
process.env.AUTH_SECRET ??= "test-secret-32-characters-long-please";
process.env.ADMIN_SESSION_SECRET ??= "admin-test-secret-32-characters-please";
process.env.NEXTAUTH_SECRET ??= process.env.AUTH_SECRET;
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/kutubi_test";

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
