import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrawButton } from '~/components/lottery/DrawButton';

describe('DrawButton', () => {
  describe('setup variant', () => {
    it('renders setup button', () => {
      render(<DrawButton variant="setup" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('세팅하기')).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      render(<DrawButton variant="setup" />);
      expect(screen.getByLabelText('세팅하기')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<DrawButton variant="setup" onClick={onClick} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('draw variant', () => {
    it('renders draw button', () => {
      render(<DrawButton variant="draw" />);
      expect(screen.getByText('추첨하기')).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      render(<DrawButton variant="draw" />);
      expect(screen.getByLabelText('추첨하기')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables button when disabled prop is true', () => {
      render(<DrawButton variant="draw" disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn();
      render(<DrawButton variant="draw" disabled onClick={onClick} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('animating state', () => {
    it('disables button when animating', () => {
      render(<DrawButton variant="draw" isAnimating />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows display number when animating', () => {
      render(<DrawButton variant="draw" isAnimating displayNumber={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('hides default text when showing display number', () => {
      render(<DrawButton variant="draw" isAnimating displayNumber={42} />);
      expect(screen.queryByText('추첨하기')).not.toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('applies sm size class', () => {
      render(<DrawButton variant="setup" size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-24', 'h-24');
    });

    it('applies md size class', () => {
      render(<DrawButton variant="setup" size="md" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-32', 'h-32');
    });

    it('applies lg size class by default', () => {
      render(<DrawButton variant="setup" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-40', 'h-40');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      render(<DrawButton variant="setup" className="custom-class" />);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });
});
