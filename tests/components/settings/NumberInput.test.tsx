import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NumberInput } from '~/components/settings/NumberInput';

describe('NumberInput', () => {
  describe('rendering', () => {
    it('renders label', () => {
      render(<NumberInput label="Test Label" value={5} onChange={() => {}} />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('renders current value', () => {
      render(<NumberInput label="Test" value={42} onChange={() => {}} />);
      expect(screen.getByDisplayValue('42')).toBeInTheDocument();
    });

    it('renders increment and decrement buttons', () => {
      render(<NumberInput label="Test" value={5} onChange={() => {}} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('increment button', () => {
    it('calls onChange with incremented value', () => {
      const onChange = vi.fn();
      render(<NumberInput label="Test" value={5} onChange={onChange} />);

      const incrementButton = screen.getByLabelText('Test 증가');
      fireEvent.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(6);
    });

    it('respects step value', () => {
      const onChange = vi.fn();
      render(<NumberInput label="Test" value={5} onChange={onChange} step={5} />);

      const incrementButton = screen.getByLabelText('Test 증가');
      fireEvent.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(10);
    });

    it('is disabled when at max value', () => {
      render(<NumberInput label="Test" value={10} onChange={() => {}} max={10} />);
      expect(screen.getByLabelText('Test 증가')).toBeDisabled();
    });

    it('does not call onChange when at max', () => {
      const onChange = vi.fn();
      render(<NumberInput label="Test" value={10} onChange={onChange} max={10} />);

      const incrementButton = screen.getByLabelText('Test 증가');
      fireEvent.click(incrementButton);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('decrement button', () => {
    it('calls onChange with decremented value', () => {
      const onChange = vi.fn();
      render(<NumberInput label="Test" value={5} onChange={onChange} />);

      const decrementButton = screen.getByLabelText('Test 감소');
      fireEvent.click(decrementButton);

      expect(onChange).toHaveBeenCalledWith(4);
    });

    it('respects step value', () => {
      const onChange = vi.fn();
      render(<NumberInput label="Test" value={10} onChange={onChange} step={5} />);

      const decrementButton = screen.getByLabelText('Test 감소');
      fireEvent.click(decrementButton);

      expect(onChange).toHaveBeenCalledWith(5);
    });

    it('is disabled when at min value', () => {
      render(<NumberInput label="Test" value={1} onChange={() => {}} min={1} />);
      expect(screen.getByLabelText('Test 감소')).toBeDisabled();
    });
  });

  describe('direct input', () => {
    it('calls onChange with parsed value on input change', () => {
      const onChange = vi.fn();
      render(<NumberInput label="Test" value={5} onChange={onChange} />);

      const input = screen.getByDisplayValue('5');
      fireEvent.change(input, { target: { value: '42' } });

      expect(onChange).toHaveBeenCalledWith(42);
    });

    it('clamps value to min', () => {
      const onChange = vi.fn();
      render(<NumberInput label="Test" value={5} onChange={onChange} min={10} />);

      const input = screen.getByDisplayValue('5');
      fireEvent.change(input, { target: { value: '3' } });

      expect(onChange).toHaveBeenCalledWith(10);
    });

    it('clamps value to max', () => {
      const onChange = vi.fn();
      render(<NumberInput label="Test" value={5} onChange={onChange} max={50} />);

      const input = screen.getByDisplayValue('5');
      fireEvent.change(input, { target: { value: '100' } });

      expect(onChange).toHaveBeenCalledWith(50);
    });

    it('ignores non-numeric input', () => {
      const onChange = vi.fn();
      render(<NumberInput label="Test" value={5} onChange={onChange} />);

      const input = screen.getByDisplayValue('5');
      fireEvent.change(input, { target: { value: 'abc' } });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('disables input when disabled', () => {
      render(<NumberInput label="Test" value={5} onChange={() => {}} disabled />);
      expect(screen.getByRole('spinbutton')).toBeDisabled();
    });

    it('disables buttons when disabled', () => {
      render(<NumberInput label="Test" value={5} onChange={() => {}} disabled />);
      expect(screen.getByLabelText('Test 증가')).toBeDisabled();
      expect(screen.getByLabelText('Test 감소')).toBeDisabled();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <NumberInput label="Test" value={5} onChange={() => {}} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
