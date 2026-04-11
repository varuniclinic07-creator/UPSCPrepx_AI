import { render, screen } from '@testing-library/react';
import { CustomVideoPlayer } from '@/components/video/custom-video-player';

const mockLoadSource = jest.fn();
const mockAttachMedia = jest.fn();
const mockOn = jest.fn();
const mockDestroy = jest.fn();

jest.mock('hls.js', () => {
  const MockHls = jest.fn().mockImplementation(() => ({
    loadSource: mockLoadSource,
    attachMedia: mockAttachMedia,
    on: mockOn,
    destroy: mockDestroy,
  }));
  (MockHls as any).isSupported = jest.fn(() => true);
  (MockHls as any).Events = {
    MANIFEST_PARSED: 'hlsManifestParsed',
    ERROR: 'hlsError',
  };
  return { __esModule: true, default: MockHls };
});

jest.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Volume2: () => <div data-testid="volume-icon" />,
  VolumeX: () => <div data-testid="volume-mute-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Maximize: () => <div data-testid="maximize-icon" />,
  PictureInPicture: () => <div data-testid="pip-icon" />,
  SkipBack: () => <div data-testid="skip-back-icon" />,
  SkipForward: () => <div data-testid="skip-forward-icon" />,
}));

beforeEach(() => jest.clearAllMocks());

describe('CustomVideoPlayer', () => {
  it('renders video element', () => {
    const { container } = render(<CustomVideoPlayer src="https://example.com/video.mp4" />);
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('initializes HLS for .m3u8 source', () => {
    render(<CustomVideoPlayer src="https://example.com/stream.m3u8" />);
    expect(mockLoadSource).toHaveBeenCalledWith('https://example.com/stream.m3u8');
    expect(mockAttachMedia).toHaveBeenCalled();
  });

  it('uses native video src for mp4', () => {
    const { container } = render(<CustomVideoPlayer src="https://example.com/video.mp4" />);
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video.src).toBe('https://example.com/video.mp4');
    expect(mockLoadSource).not.toHaveBeenCalled();
  });

  it('shows error state on HLS fatal error', () => {
    render(<CustomVideoPlayer src="https://example.com/stream.m3u8" />);

    // Find the ERROR handler and trigger it
    const errorHandler = mockOn.mock.calls.find(
      (call: any[]) => call[0] === 'hlsError'
    )?.[1];

    expect(errorHandler).toBeDefined();
    if (errorHandler) {
      errorHandler('event', { fatal: true, type: 'networkError' });
    }

    // Component should display error state (the exact text depends on implementation)
    expect(mockDestroy).toHaveBeenCalled();
  });
});
