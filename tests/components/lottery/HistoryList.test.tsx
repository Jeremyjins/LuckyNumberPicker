import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryList } from '~/components/lottery/HistoryList';

describe('HistoryList', () => {
  describe('rendering', () => {
    it('renders numbers from drawRounds', () => {
      render(
        <HistoryList drawRounds={[[1, 2, 3]]} allowRestore={false} onRestore={() => {}} />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('returns null when drawRounds is empty', () => {
      const { container } = render(
        <HistoryList drawRounds={[]} allowRestore={false} onRestore={() => {}} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('shows total count label', () => {
      render(
        <HistoryList drawRounds={[[1, 2], [3]]} allowRestore={false} onRestore={() => {}} />
      );
      expect(screen.getByText('추첨 기록 (3개)')).toBeInTheDocument();
    });

    it('shows round labels', () => {
      render(
        <HistoryList drawRounds={[[1, 2], [3, 4]]} allowRestore={false} onRestore={() => {}} />
      );
      expect(screen.getByText('1회차')).toBeInTheDocument();
      expect(screen.getByText('2회차')).toBeInTheDocument();
    });

    it('renders multiple rounds correctly', () => {
      render(
        <HistoryList drawRounds={[[7, 23], [1, 5, 9]]} allowRestore={false} onRestore={() => {}} />
      );
      // 총 5개 숫자 모두 표시
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('restore functionality', () => {
    it('shows restore buttons when allowRestore is true', () => {
      render(
        <HistoryList drawRounds={[[1, 2]]} allowRestore={true} onRestore={() => {}} />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('hides restore buttons when allowRestore is false', () => {
      render(
        <HistoryList drawRounds={[[1, 2]]} allowRestore={false} onRestore={() => {}} />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onRestore with correct number when restore button is clicked', () => {
      const onRestore = vi.fn();
      render(
        <HistoryList drawRounds={[[1, 2, 3]]} allowRestore={true} onRestore={onRestore} />
      );
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]); // second item
      expect(onRestore).toHaveBeenCalledWith(2);
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <HistoryList
          drawRounds={[[1, 2]]}
          allowRestore={false}
          onRestore={() => {}}
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
