import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryList } from '~/components/lottery/HistoryList';

describe('HistoryList', () => {
  describe('rendering', () => {
    it('renders history items', () => {
      render(<HistoryList history={[1, 2, 3]} allowRestore={false} onRestore={() => {}} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('returns null when history is empty', () => {
      const { container } = render(
        <HistoryList history={[]} allowRestore={false} onRestore={() => {}} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('shows count label', () => {
      render(<HistoryList history={[1, 2, 3]} allowRestore={false} onRestore={() => {}} />);
      expect(screen.getByText('추첨 기록 (3개)')).toBeInTheDocument();
    });
  });

  describe('restore functionality', () => {
    it('shows remove buttons when allowRestore is true', () => {
      render(<HistoryList history={[1, 2]} allowRestore={true} onRestore={() => {}} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('hides remove buttons when allowRestore is false', () => {
      render(<HistoryList history={[1, 2]} allowRestore={false} onRestore={() => {}} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onRestore with correct number when remove button is clicked', () => {
      const onRestore = vi.fn();
      render(<HistoryList history={[1, 2, 3]} allowRestore={true} onRestore={onRestore} />);

      // Click the remove button for number 2
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]); // Second item

      expect(onRestore).toHaveBeenCalledWith(2);
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <HistoryList
          history={[1, 2]}
          allowRestore={false}
          onRestore={() => {}}
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
