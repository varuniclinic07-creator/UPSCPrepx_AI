import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentChat } from '@/components/tools/document-chat';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => jest.clearAllMocks());

describe('DocumentChat', () => {
  it('renders upload zone initially', () => {
    render(<DocumentChat />);
    expect(screen.getByText('Chat with Document')).toBeInTheDocument();
    expect(screen.getByText(/Click to upload PDF/)).toBeInTheDocument();
  });

  it('shows uploading state during upload', async () => {
    let resolveUpload: any;
    mockFetch.mockReturnValueOnce(new Promise(r => { resolveUpload = r; }));

    render(<DocumentChat />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('Uploading...')).toBeInTheDocument();

    resolveUpload({
      ok: true,
      json: () => Promise.resolve({ documentId: 'doc-1', filename: 'test.pdf', pages: 5 }),
    });
    await waitFor(() => {
      expect(screen.getByText(/uploaded successfully/)).toBeInTheDocument();
    });
  });

  it('shows success message after upload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ documentId: 'doc-1', filename: 'test.pdf', pages: 5 }),
    });

    render(<DocumentChat />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/test.pdf.*uploaded successfully.*5 pages/)).toBeInTheDocument();
    });
  });

  it('disables input until document uploaded', () => {
    render(<DocumentChat />);
    const input = screen.getByPlaceholderText('Ask about the document...');
    expect(input).toBeDisabled();
    const sendBtn = screen.getByText('Send');
    expect(sendBtn).toBeDisabled();
  });

  it('sends message and shows response', async () => {
    // Upload first
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ documentId: 'doc-1', filename: 'test.pdf', pages: 2 }),
    });

    render(<DocumentChat />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'test.pdf', { type: 'application/pdf' })] } });

    await waitFor(() => expect(screen.getByText(/uploaded successfully/)).toBeInTheDocument());

    // Now chat
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ answer: 'The document discusses AI.' }),
    });

    const input = screen.getByPlaceholderText('Ask about the document...');
    fireEvent.change(input, { target: { value: 'What is this about?' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('What is this about?')).toBeInTheDocument();
      expect(screen.getByText('The document discusses AI.')).toBeInTheDocument();
    });
  });

  it('shows error on failed chat', async () => {
    // Upload first
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ documentId: 'doc-1', filename: 'test.pdf', pages: 2 }),
    });

    render(<DocumentChat />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'test.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect(screen.getByText(/uploaded successfully/)).toBeInTheDocument());

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const input = screen.getByPlaceholderText('Ask about the document...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Error:.*Server error/)).toBeInTheDocument();
    });
  });
});
