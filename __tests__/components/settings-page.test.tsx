/**
 * Tests for Settings page — loads data, saves on submit, shows messages
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

import SettingsPage from '@/app/dashboard/settings/page';

describe('Settings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves

    render(<SettingsPage />);

    // Loading spinner should be visible (Loader2 component with animate-spin)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should load and display user settings', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: 'DR-VARUNI',
        email: 'test@example.com',
        preferences: {
          optionalSubject: 'Geography',
          language: 'English',
          notifications: { dailyDigest: true, weeklyAlerts: false, lectureNotifs: true },
        },
      }),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('DR-VARUNI')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith('/api/user/settings');
  });

  it('should show email as disabled', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Test', email: 'test@test.com', preferences: {} }),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue('test@test.com');
      expect(emailInput).toBeDisabled();
    });
  });

  it('should save settings and show success message', async () => {
    const user = userEvent.setup();

    // First call: GET settings
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Old Name', email: 'test@test.com', preferences: {} }),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument();
    });

    // Change name
    const nameInput = screen.getByDisplayValue('Old Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');

    // Mock PUT response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Click save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
    });

    // Verify PUT was called
    expect(mockFetch).toHaveBeenCalledWith('/api/user/settings', expect.objectContaining({
      method: 'PUT',
    }));
  });

  it('should show error message when save fails', async () => {
    const user = userEvent.setup();

    // GET settings
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Test', email: 'test@test.com', preferences: {} }),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });

    // Mock failed PUT
    mockFetch.mockResolvedValueOnce({ ok: false });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save settings. Please try again.')).toBeInTheDocument();
    });
  });

  it('should have a back to dashboard link', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: '', email: '', preferences: {} }),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/back to dashboard/i)).toBeInTheDocument();
    });

    const backLink = screen.getByText(/back to dashboard/i).closest('a');
    expect(backLink).toHaveAttribute('href', '/dashboard');
  });
});
