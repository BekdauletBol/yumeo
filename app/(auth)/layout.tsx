export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'var(--bg-base)' }}
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1
            className="text-2xl font-medium"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Yumeo
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Research IDE — grounded in your materials
          </p>
        </div>
  
        {/* Clerk form */}
        <div>{children}</div>
  
        {/* Footer */}
        <p className="mt-8 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Every AI response grounded exclusively in your uploaded research.
        </p>
      </div>
    );
  }