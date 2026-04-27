import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlanBadge } from '@/components/sections/PlanBadge';
import { UsageMeter } from '@/components/sections/UsageMeter';

// ─── PlanBadge ────────────────────────────────────────────────────────────────

describe('PlanBadge', () => {
  it('renders FREE for free plan', () => {
    render(<PlanBadge plan="free" />);
    expect(screen.getByText('FREE')).toBeDefined();
  });

  it('renders PRO for pro plan', () => {
    render(<PlanBadge plan="pro" />);
    expect(screen.getByText('PRO')).toBeDefined();
  });

  it('renders a link for free plan (upgrade prompt)', () => {
    render(<PlanBadge plan="free" />);
    expect(screen.getByRole('link')).toBeDefined();
  });

  it('renders a span (not a link) for pro plan', () => {
    render(<PlanBadge plan="pro" />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});

// ─── UsageMeter ───────────────────────────────────────────────────────────────

describe('UsageMeter', () => {
  it('renders two progress bars', () => {
    render(<UsageMeter plan="free" currentFiles={3} currentProjects={1} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(2);
  });

  it('shows correct file count in aria-valuenow', () => {
    render(<UsageMeter plan="free" currentFiles={7} currentProjects={1} />);
    const fileBar = screen.getAllByRole('progressbar')[0];
    expect(fileBar?.getAttribute('aria-valuenow')).toBe('7');
  });

  it('shows correct project count in aria-valuenow', () => {
    render(<UsageMeter plan="free" currentFiles={1} currentProjects={2} />);
    const projectBar = screen.getAllByRole('progressbar')[1];
    expect(projectBar?.getAttribute('aria-valuenow')).toBe('2');
  });

  it('renders with pro plan limits', () => {
    render(<UsageMeter plan="pro" currentFiles={50} currentProjects={10} />);
    expect(screen.getByText(/50 \/ 100/)).toBeDefined();
  });
});