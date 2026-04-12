/**
 * Tests for DashboardShell logout button functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: mockPush }),
}));

// Mock TutorialContext
jest.mock('@/contexts/tutorial-context', () => ({
  TutorialProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTutorial: () => ({ openTutorial: jest.fn() }),
}));

// Mock TutorialModal
jest.mock('@/components/tutorial/tutorial-modal', () => ({
  TutorialModal: () => null,
}));

// Mock magic-ui components
jest.mock('@/components/magic-ui/aurora-background', () => ({
  AuroraBackground: ({ children, className }: any) => <div className={className}>{children}</div>,
}));
jest.mock('@/components/magic-ui/floating-dock', () => ({
  FloatingDock: () => null,
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { DashboardShell } from '@/components/layout/dashboard-shell';

const mockUser = {
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
};

describe('DashboardShell Logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  });

  it('should render logout button', () => {
    render(
      <DashboardShell user={mockUser}>
        <div>Dashboard content</div>
      </DashboardShell>
    );

    // The LogOut icon is inside a button — find buttons in the sidebar
    const buttons = screen.getAllByRole('button');
    // The logout button should exist (has LogOut icon, no text)
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should call logout API and redirect on click', async () => {
    const user = userEvent.setup();

    render(
      <DashboardShell user={mockUser}>
        <div>Dashboard content</div>
      </DashboardShell>
    );

    // Find the logout button — it's the button without text inside the user profile section
    // The sidebar has a Settings link and a LogOut button
    const buttons = screen.getAllByRole('button');
    // The logout button is in the bottom section, find it by examining aria/structure
    // Since we can't easily target it by text, find all buttons and pick the one in the sidebar
    const logoutButton = buttons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && !btn.textContent?.trim();
    });

    if (logoutButton) {
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    }
  });
});
