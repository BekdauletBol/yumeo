import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter:   () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  redirect:    vi.fn(),
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser:   () => ({ user: { id: 'test-user-id' }, isLoaded: true }),
  auth:      () => ({ userId: 'test-user-id' }),
  UserButton: () => null,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth:        () => ({ userId: 'test-user-id' }),
  currentUser: async () => ({ id: 'test-user-id', emailAddresses: [] }),
  clerkMiddleware:    vi.fn(),
  createRouteMatcher: vi.fn(() => () => false),
}));