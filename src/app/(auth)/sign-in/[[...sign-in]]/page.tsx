import { SignIn } from '@clerk/nextjs';

const GOOGLE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%23EA4335' d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'/%3E%3Cpath fill='%234285F4' d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'/%3E%3Cpath fill='%23FBBC05' d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'/%3E%3Cpath fill='%2334A853' d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'/%3E%3C/svg%3E";

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        variables: {
          colorBackground: '#151515',
          colorText: 'rgba(255,255,255,0.9)',
          colorTextSecondary: 'rgba(255,255,255,0.6)',
          colorInputBackground: '#1a1a1a',
          colorInputText: 'rgba(255,255,255,0.9)',
          colorPrimary: '#c8c8c8',
          colorNeutral: 'rgba(255,255,255,0.16)',
          borderRadius: '0px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '14px',
        },
        elements: {
          card: {
            background: '#151515',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: 'none',
            borderRadius: '0px',
          },
          headerTitle: {
            color: 'rgba(255,255,255,0.9)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '18px',
            fontWeight: '500',
          },
          headerSubtitle: {
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
          },
          socialButtonsBlockButton: {
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.85)',
            borderRadius: '0px',
          },
          socialButtonsProviderIcon__google: {
            backgroundImage: `url("${GOOGLE_SVG}")`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            width: '18px',
            height: '18px',
            display: 'inline-block',
          },
          formFieldInput: {
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.9)',
            borderRadius: '0px',
            fontSize: '14px',
          },
          formFieldLabel: {
            color: 'rgba(255,255,255,0.55)',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          },
          formButtonPrimary: {
            background: '#242424',
            border: '1px solid rgba(255,255,255,0.16)',
            color: 'rgba(255,255,255,0.9)',
            borderRadius: '0px',
            fontSize: '14px',
            fontWeight: '500',
          },
          dividerLine: {
            background: 'rgba(255,255,255,0.1)',
          },
          dividerText: {
            color: 'rgba(255,255,255,0.35)',
            fontSize: '12px',
          },
          footerActionText: {
            color: 'rgba(255,255,255,0.45)',
            fontSize: '13px',
          },
          footerActionLink: {
            color: 'rgba(255,255,255,0.8)',
          },
          identityPreviewText: {
            color: 'rgba(255,255,255,0.7)',
          },
        },
      }}
    />
  );
}