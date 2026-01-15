import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryItem } from '~/components/lottery/HistoryItem';

describe('HistoryItem', () => {
  describe('rendering', () => {
    it('renders the number', () => {
      render(<HistoryItem number={42} showRemoveButton={false} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('remove button', () => {
    it('shows remove button when showRemoveButton is true', () => {
      render(<HistoryItem number={42} showRemoveButton={true} onRemove={() => {}} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('hides remove button when showRemoveButton is false', () => {
      render(<HistoryItem number={42} showRemoveButton={false} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('hides remove button when onRemove is not provided', () => {
      render(<HistoryItem number={42} showRemoveButton={true} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onRemove when remove button is clicked', () => {
      const onRemove = vi.fn();
      render(<HistoryItem number={42} showRemoveButton={true} onRemove={onRemove} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('has correct aria-label for remove button', () => {
      render(<HistoryItem number={42} showRemoveButton={true} onRemove={() => {}} />);
      expect(screen.getByLabelText('42 번호 복원')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <HistoryItem number={42} showRemoveButton={false} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
