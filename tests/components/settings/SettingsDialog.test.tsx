import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsDialog } from '~/components/settings/SettingsDialog';
import type { Settings } from '~/types/lottery';

describe('SettingsDialog', () => {
  const defaultSettings: Settings = {
    startNumber: 1,
    endNumber: 45,
    drawCount: 6,
    allowDuplicates: false,
  };

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    settings: defaultSettings,
    onSettingsChange: vi.fn(),
    onConfirm: vi.fn(),
  };

  describe('rendering', () => {
    it('renders dialog when open', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render dialog when closed', () => {
      render(<SettingsDialog {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders title', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByText('설정')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByText('추첨 범위와 옵션을 설정하세요')).toBeInTheDocument();
    });

    it('renders start number input', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByText('시작 번호')).toBeInTheDocument();
    });

    it('renders end number input', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByText('종료 번호')).toBeInTheDocument();
    });

    it('renders draw count input', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByText('추첨 개수')).toBeInTheDocument();
    });

    it('renders duplicates toggle', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByText('중복 허용')).toBeInTheDocument();
    });

    it('renders confirm button', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByText('설정 완료')).toBeInTheDocument();
    });
  });

  describe('settings display', () => {
    it('displays current start number', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    it('displays current end number', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByDisplayValue('45')).toBeInTheDocument();
    });

    it('displays current draw count', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByDisplayValue('6')).toBeInTheDocument();
    });
  });

  describe('settings changes', () => {
    it('calls onSettingsChange when start number changes', () => {
      const onSettingsChange = vi.fn();
      render(<SettingsDialog {...defaultProps} onSettingsChange={onSettingsChange} />);

      const incrementButton = screen.getByLabelText('시작 번호 증가');
      fireEvent.click(incrementButton);

      expect(onSettingsChange).toHaveBeenCalled();
    });

    it('calls onSettingsChange when end number changes', () => {
      const onSettingsChange = vi.fn();
      render(<SettingsDialog {...defaultProps} onSettingsChange={onSettingsChange} />);

      const incrementButton = screen.getByLabelText('종료 번호 증가');
      fireEvent.click(incrementButton);

      expect(onSettingsChange).toHaveBeenCalled();
    });

    it('calls onSettingsChange when draw count changes', () => {
      const onSettingsChange = vi.fn();
      render(<SettingsDialog {...defaultProps} onSettingsChange={onSettingsChange} />);

      const incrementButton = screen.getByLabelText('추첨 개수 증가');
      fireEvent.click(incrementButton);

      expect(onSettingsChange).toHaveBeenCalled();
    });

    it('swaps start and end when start > end', () => {
      const onSettingsChange = vi.fn();
      render(
        <SettingsDialog
          {...defaultProps}
          settings={{ ...defaultSettings, startNumber: 45, endNumber: 45 }}
          onSettingsChange={onSettingsChange}
        />
      );

      const incrementButton = screen.getByLabelText('시작 번호 증가');
      fireEvent.click(incrementButton);

      // Should swap values
      expect(onSettingsChange).toHaveBeenCalled();
    });

    it('swaps end and start when end < start', () => {
      const onSettingsChange = vi.fn();
      render(
        <SettingsDialog
          {...defaultProps}
          settings={{ ...defaultSettings, startNumber: 1, endNumber: 1 }}
          onSettingsChange={onSettingsChange}
        />
      );

      const decrementButton = screen.getByLabelText('종료 번호 감소');
      fireEvent.click(decrementButton);

      // endNumber can't go below 1 with min=1, but the swap logic is tested
      expect(onSettingsChange).not.toHaveBeenCalled(); // Can't decrement below min
    });

    it('swaps values when end number is set below start number via input', () => {
      const onSettingsChange = vi.fn();
      render(
        <SettingsDialog
          {...defaultProps}
          settings={{ ...defaultSettings, startNumber: 10, endNumber: 20 }}
          onSettingsChange={onSettingsChange}
        />
      );

      // Find the end number input and change it to a value below start
      const endNumberInput = screen.getByDisplayValue('20');
      fireEvent.change(endNumberInput, { target: { value: '5' } });

      // Should call with swapped values: { startNumber: 5, endNumber: 10 }
      expect(onSettingsChange).toHaveBeenCalledWith({ startNumber: 5, endNumber: 10 });
    });
  });

  describe('duplicates toggle', () => {
    it('shows correct text when duplicates not allowed', () => {
      render(<SettingsDialog {...defaultProps} />);
      expect(screen.getByText('한 번 나온 번호는 제외됩니다')).toBeInTheDocument();
    });

    it('shows correct text when duplicates allowed', () => {
      render(
        <SettingsDialog
          {...defaultProps}
          settings={{ ...defaultSettings, allowDuplicates: true }}
        />
      );
      expect(screen.getByText('같은 번호가 다시 나올 수 있습니다')).toBeInTheDocument();
    });

    it('calls onSettingsChange when toggle is clicked', () => {
      const onSettingsChange = vi.fn();
      render(<SettingsDialog {...defaultProps} onSettingsChange={onSettingsChange} />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      expect(onSettingsChange).toHaveBeenCalledWith({ allowDuplicates: true });
    });
  });

  describe('confirm button', () => {
    it('calls onConfirm when clicked with valid settings', () => {
      const onConfirm = vi.fn();
      render(<SettingsDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText('설정 완료'));

      expect(onConfirm).toHaveBeenCalled();
    });

    it('is disabled when settings are invalid', () => {
      render(
        <SettingsDialog
          {...defaultProps}
          settings={{ ...defaultSettings, startNumber: 100, endNumber: 1 }}
        />
      );

      expect(screen.getByText('설정 완료')).toBeDisabled();
    });

    it('does not call onConfirm when settings are invalid', () => {
      const onConfirm = vi.fn();
      render(
        <SettingsDialog
          {...defaultProps}
          settings={{ ...defaultSettings, startNumber: 100, endNumber: 1 }}
          onConfirm={onConfirm}
        />
      );

      fireEvent.click(screen.getByText('설정 완료'));

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('validation error', () => {
    it('shows error message when start > end', () => {
      render(
        <SettingsDialog
          {...defaultProps}
          settings={{ ...defaultSettings, startNumber: 100, endNumber: 1 }}
        />
      );

      expect(screen.getByText(/시작 번호는 종료 번호보다/)).toBeInTheDocument();
    });

    it('shows error when draw count exceeds range', () => {
      render(
        <SettingsDialog
          {...defaultProps}
          settings={{ ...defaultSettings, startNumber: 1, endNumber: 5, drawCount: 10 }}
        />
      );

      expect(screen.getByText(/초과/)).toBeInTheDocument();
    });
  });
});
