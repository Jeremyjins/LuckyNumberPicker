import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '~/components/lottery/StatusBar';

describe('StatusBar', () => {
  describe('rendering', () => {
    it('renders remaining count', () => {
      render(<StatusBar remainingCount={10} totalCount={45} allowDuplicates={false} />);
      expect(screen.getByText('남은 번호:')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('shows total count', () => {
      render(<StatusBar remainingCount={10} totalCount={45} allowDuplicates={false} />);
      expect(screen.getByText('/45개')).toBeInTheDocument();
    });
  });

  describe('duplicates allowed', () => {
    it('shows unlimited when duplicates allowed', () => {
      render(<StatusBar remainingCount={45} totalCount={45} allowDuplicates={true} />);
      expect(screen.getByText('무제한')).toBeInTheDocument();
    });

    it('does not show count when duplicates allowed', () => {
      render(<StatusBar remainingCount={10} totalCount={45} allowDuplicates={true} />);
      expect(screen.queryByText('10')).not.toBeInTheDocument();
      expect(screen.queryByText('/45개')).not.toBeInTheDocument();
    });
  });

  describe('low count warning', () => {
    it('applies warning style when count is low (<=3)', () => {
      render(<StatusBar remainingCount={3} totalCount={45} allowDuplicates={false} />);
      const countElement = screen.getByText('3');
      expect(countElement).toHaveClass('text-orange-500');
    });

    it('applies warning style when count is 1', () => {
      render(<StatusBar remainingCount={1} totalCount={45} allowDuplicates={false} />);
      const countElement = screen.getByText('1');
      expect(countElement).toHaveClass('text-orange-500');
    });

    it('does not apply warning when count is above 3', () => {
      render(<StatusBar remainingCount={4} totalCount={45} allowDuplicates={false} />);
      const countElement = screen.getByText('4');
      expect(countElement).not.toHaveClass('text-orange-500');
    });
  });

  describe('empty state', () => {
    it('applies destructive style when empty', () => {
      render(<StatusBar remainingCount={0} totalCount={45} allowDuplicates={false} />);
      const countElement = screen.getByText('0');
      expect(countElement).toHaveClass('text-destructive');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <StatusBar remainingCount={10} totalCount={45} allowDuplicates={false} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
