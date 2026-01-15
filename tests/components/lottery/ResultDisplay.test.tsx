import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultDisplay } from '~/components/lottery/ResultDisplay';

describe('ResultDisplay', () => {
  describe('rendering', () => {
    it('renders numbers when visible', () => {
      render(<ResultDisplay numbers={[7, 13, 42]} isVisible={true} />);
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('13')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('returns null when not visible', () => {
      const { container } = render(<ResultDisplay numbers={[7]} isVisible={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when numbers array is empty', () => {
      const { container } = render(<ResultDisplay numbers={[]} isVisible={true} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('messages', () => {
    it('shows singular message for one number', () => {
      render(<ResultDisplay numbers={[7]} isVisible={true} />);
      expect(screen.getByText('행운의 번호가 선택되었습니다!')).toBeInTheDocument();
    });

    it('shows plural message for multiple numbers', () => {
      render(<ResultDisplay numbers={[7, 13, 42]} isVisible={true} />);
      expect(screen.getByText('3개의 번호가 선택되었습니다!')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(<ResultDisplay numbers={[7]} isVisible={true} className="custom-class" />);
      // The className is applied to the outermost flex container
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('applies animation delay based on index', () => {
      render(<ResultDisplay numbers={[7, 13, 42]} isVisible={true} />);
      const numberElements = screen.getAllByText(/^\d+$/);

      expect(numberElements[0].closest('div[style]')).toHaveStyle({ animationDelay: '0ms' });
      expect(numberElements[1].closest('div[style]')).toHaveStyle({ animationDelay: '100ms' });
      expect(numberElements[2].closest('div[style]')).toHaveStyle({ animationDelay: '200ms' });
    });
  });
});
