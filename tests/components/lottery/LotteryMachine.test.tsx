import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LotteryMachine } from '~/components/lottery/LotteryMachine';

// Mock the useDrawAnimation hook to avoid timing issues
vi.mock('~/hooks/useDrawAnimation', () => ({
  useDrawAnimation: () => ({
    isAnimating: false,
    currentDisplay: null,
    start: vi.fn(),
  }),
}));

// localStorage mock for useTheme
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

describe('LotteryMachine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    document.documentElement.classList.remove('dark');
  });

  describe('initial state', () => {
    it('renders setup button on initial load', () => {
      render(<LotteryMachine />);
      expect(screen.getByText('세팅하기')).toBeInTheDocument();
    });

    it('does not show status bar initially', () => {
      render(<LotteryMachine />);
      expect(screen.queryByText('남은 번호:')).not.toBeInTheDocument();
    });

    it('does not show history initially', () => {
      render(<LotteryMachine />);
      expect(screen.queryByText(/추첨 기록/)).not.toBeInTheDocument();
    });
  });

  describe('settings dialog', () => {
    it('opens settings dialog when setup button is clicked', async () => {
      render(<LotteryMachine />);

      fireEvent.click(screen.getByText('세팅하기'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('shows settings form in dialog', async () => {
      render(<LotteryMachine />);

      fireEvent.click(screen.getByText('세팅하기'));

      await waitFor(() => {
        expect(screen.getByText('시작 번호')).toBeInTheDocument();
        expect(screen.getByText('종료 번호')).toBeInTheDocument();
        expect(screen.getByText('추첨 개수')).toBeInTheDocument();
      });
    });

    it('transitions to ready state after confirming settings', async () => {
      render(<LotteryMachine />);

      // Open settings
      fireEvent.click(screen.getByText('세팅하기'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Confirm settings
      fireEvent.click(screen.getByText('설정 완료'));

      await waitFor(() => {
        expect(screen.getByText('추첨하기')).toBeInTheDocument();
      });
    });
  });

  describe('ready state', () => {
    it('shows status bar after settings confirmed', async () => {
      render(<LotteryMachine />);

      fireEvent.click(screen.getByText('세팅하기'));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      fireEvent.click(screen.getByText('설정 완료'));

      await waitFor(() => {
        expect(screen.getByText('남은 번호:')).toBeInTheDocument();
      });
    });

    it('shows draw button in ready state', async () => {
      render(<LotteryMachine />);

      fireEvent.click(screen.getByText('세팅하기'));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      fireEvent.click(screen.getByText('설정 완료'));

      await waitFor(() => {
        expect(screen.getByText('추첨하기')).toBeInTheDocument();
      });
    });

    it('shows reset button in ready state', async () => {
      render(<LotteryMachine />);

      fireEvent.click(screen.getByText('세팅하기'));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      fireEvent.click(screen.getByText('설정 완료'));

      await waitFor(() => {
        expect(screen.getByText('다시 설정하기')).toBeInTheDocument();
      });
    });
  });

  describe('reset functionality', () => {
    it('returns to initial state when reset button is clicked', async () => {
      render(<LotteryMachine />);

      // Go to ready state
      fireEvent.click(screen.getByText('세팅하기'));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      fireEvent.click(screen.getByText('설정 완료'));

      await waitFor(() => {
        expect(screen.getByText('다시 설정하기')).toBeInTheDocument();
      });

      // Reset
      fireEvent.click(screen.getByText('다시 설정하기'));

      await waitFor(() => {
        expect(screen.getByText('세팅하기')).toBeInTheDocument();
        expect(screen.queryByText('남은 번호:')).not.toBeInTheDocument();
      });
    });
  });

  describe('draw functionality', () => {
    it('clicking draw button triggers draw action', async () => {
      render(<LotteryMachine />);

      // Go to ready state
      fireEvent.click(screen.getByText('세팅하기'));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      fireEvent.click(screen.getByText('설정 완료'));

      await waitFor(() => {
        expect(screen.getByText('추첨하기')).toBeInTheDocument();
      });

      // Click draw button
      fireEvent.click(screen.getByText('추첨하기'));

      // Draw button should still be visible (mocked animation returns immediately)
      expect(screen.getByLabelText('추첨하기')).toBeInTheDocument();
    });
  });
});
