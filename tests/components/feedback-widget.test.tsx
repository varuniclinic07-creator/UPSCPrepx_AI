import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackWidget } from '@/components/feedback/feedback-widget';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
});

describe('FeedbackWidget', () => {
  it('renders floating button when closed', () => {
    render(<FeedbackWidget />);
    expect(screen.getByTitle('Send Feedback')).toBeInTheDocument();
  });

  it('opens form when button clicked', () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTitle('Send Feedback'));
    expect(screen.getByText('Send Feedback', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
  });

  it('shows 3 type options', () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTitle('Send Feedback'));
    expect(screen.getByText(/💭 Feedback/)).toBeInTheDocument();
    expect(screen.getByText(/🐛 Bug/)).toBeInTheDocument();
    expect(screen.getByText(/💡 Feature/)).toBeInTheDocument();
  });

  it('shows rating stars only for feedback type', () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTitle('Send Feedback'));
    expect(screen.getByText('How would you rate us?')).toBeInTheDocument();
  });

  it('hides rating stars for bug type', () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTitle('Send Feedback'));
    fireEvent.click(screen.getByText(/Bug/));
    expect(screen.queryByText('How would you rate us?')).not.toBeInTheDocument();
  });

  it('submits feedback successfully', async () => {
    render(<FeedbackWidget userId="user-1" context="test" />);
    fireEvent.click(screen.getByTitle('Send Feedback'));
    fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), { target: { value: 'Great!' } });
    fireEvent.click(screen.getByText('Send Feedback', { selector: 'button[type="submit"]' }));

    await waitFor(() => {
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({ method: 'POST' }));
  });

  it('shows error on failed submission', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, text: () => Promise.resolve('Error') });
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTitle('Send Feedback'));
    fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), { target: { value: 'Bug report' } });
    fireEvent.click(screen.getByText('Send Feedback', { selector: 'button[type="submit"]' }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to send feedback/)).toBeInTheDocument();
    });
  });

  it('disables submit button while submitting', async () => {
    let resolveSubmit: any;
    mockFetch.mockReturnValueOnce(new Promise(r => { resolveSubmit = r; }));

    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTitle('Send Feedback'));
    fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Send Feedback', { selector: 'button[type="submit"]' }));

    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(screen.getByText('Sending...').closest('button')).toBeDisabled();

    resolveSubmit({ ok: true, json: () => Promise.resolve({ success: true }) });
    await waitFor(() => expect(screen.getByText('Thank you!')).toBeInTheDocument());
  });
});
