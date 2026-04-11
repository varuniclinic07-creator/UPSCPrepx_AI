import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileNavigator } from '@/components/tools/file-navigator';

const mockList = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        list: mockList,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

const mockOpen = jest.fn();
Object.defineProperty(window, 'open', { value: mockOpen, writable: true });

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/file.pdf' } });
});

describe('FileNavigator', () => {
  it('shows loading state initially', () => {
    mockList.mockReturnValue(new Promise(() => {})); // never resolves
    render(<FileNavigator />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when no files', async () => {
    mockList.mockResolvedValue({ data: [], error: null });
    render(<FileNavigator />);
    await waitFor(() => {
      expect(screen.getByText('No files found')).toBeInTheDocument();
    });
  });

  it('renders folders and files', async () => {
    mockList.mockResolvedValue({
      data: [
        { name: 'Documents', id: null, metadata: null },
        { name: 'report.pdf', id: '123', metadata: { size: 1048576 } },
      ],
      error: null,
    });

    render(<FileNavigator />);
    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });
  });

  it('navigates into folder on click', async () => {
    mockList
      .mockResolvedValueOnce({
        data: [{ name: 'Subfolder', id: null, metadata: null }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ name: 'inner.txt', id: '456', metadata: { size: 512 } }],
        error: null,
      });

    render(<FileNavigator />);
    await waitFor(() => expect(screen.getByText('Subfolder')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Subfolder'));
    await waitFor(() => expect(screen.getByText('inner.txt')).toBeInTheDocument());
  });

  it('shows up button when in subfolder', async () => {
    mockList
      .mockResolvedValueOnce({
        data: [{ name: 'Folder', id: null, metadata: null }],
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null });

    render(<FileNavigator />);
    await waitFor(() => expect(screen.getByText('Folder')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Folder'));

    await waitFor(() => {
      expect(screen.getByText(/Up/)).toBeInTheDocument();
    });
  });

  it('downloads file on download click', async () => {
    mockList.mockResolvedValue({
      data: [{ name: 'doc.pdf', id: '789', metadata: { size: 1024 } }],
      error: null,
    });

    render(<FileNavigator />);
    await waitFor(() => expect(screen.getByText('doc.pdf')).toBeInTheDocument());

    // Find the download button (⬇️)
    const downloadBtn = screen.getByText('⬇️');
    fireEvent.click(downloadBtn);

    expect(mockOpen).toHaveBeenCalledWith('https://example.com/file.pdf', '_blank');
  });
});
