import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home, { meta } from '~/routes/home';

// Mock LotteryMachine to isolate home.tsx testing
vi.mock('~/components/lottery/LotteryMachine', () => ({
  LotteryMachine: () => <div data-testid="lottery-machine">Mocked LotteryMachine</div>,
}));

describe('home route', () => {
  describe('Home component', () => {
    it('renders LotteryMachine component', () => {
      render(<Home />);
      expect(screen.getByTestId('lottery-machine')).toBeInTheDocument();
    });
  });

  describe('meta function', () => {
    it('returns correct title', () => {
      const result = meta({} as any);
      const titleMeta = result.find((m: any) => m.title);
      expect(titleMeta).toEqual({ title: '행운번호 추첨기' });
    });

    it('returns correct description', () => {
      const result = meta({} as any);
      const descMeta = result.find((m: any) => m.name === 'description');
      expect(descMeta).toEqual({
        name: 'description',
        content: '간편하게 행운의 번호를 추첨하세요!',
      });
    });

    it('returns correct viewport meta', () => {
      const result = meta({} as any);
      const viewportMeta = result.find((m: any) => m.name === 'viewport');
      expect(viewportMeta).toEqual({
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      });
    });
  });
});
