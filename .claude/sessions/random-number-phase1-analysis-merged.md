# Session: random-number-phase1-analysis-merged

**Date**: 2026-01-15
**Description**: 병합된 분석 보고서 - 보안 감사, 테스트 스위트, 성능 분석

---

## Executive Summary

행운번호 추첨기 MVP에 대한 3가지 병렬 분석 완료:

| 분석 유형 | 위험 수준 | 주요 발견 |
|----------|----------|----------|
| 보안 감사 | MEDIUM | 입력 검증 우회, Math.random 사용 |
| 테스트 스위트 | N/A | Vitest 설정 및 테스트 코드 제공 |
| 성능 분석 | LOW | HistoryList 최적화 권장 |

---

## 1. Security Audit Report (보안 감사)

### 위험 등급: MEDIUM

### HIGH 심각도

#### 1.1 입력 최대값 검증 우회
- **위치**: `app/components/settings/NumberInput.tsx`
- **문제**: max prop이 전달되지만 직접 입력 시 검증 부재
- **영향**: 사용자가 허용 범위 초과 값 입력 가능
- **수정 방안**:
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = parseInt(e.target.value, 10);
  if (!isNaN(val) && val >= min && val <= max) {
    onChange(val);
  }
};
```

#### 1.2 범위 최대값 검증 부재
- **위치**: `app/lib/lottery.ts:validateSettings`
- **문제**: startNumber와 endNumber에 상한선 없음
- **영향**: 메모리 고갈 공격 가능성 (예: 1~10억 범위)
- **수정 방안**:
```typescript
const MAX_RANGE = 10000;
if (endNumber - startNumber > MAX_RANGE) {
  return { valid: false, error: '범위가 너무 큽니다' };
}
```

### MEDIUM 심각도

#### 1.3 Math.random() 사용
- **위치**: `app/lib/lottery.ts:getRandomNumber`
- **문제**: 암호학적으로 안전하지 않은 난수 생성
- **영향**: 예측 가능한 난수 (일반 사용에는 문제 없음)
- **수정 방안** (필요 시):
```typescript
const array = new Uint32Array(1);
crypto.getRandomValues(array);
return min + (array[0] % (max - min + 1));
```

#### 1.4 Reducer 설정 검증 부재
- **위치**: `app/hooks/useLotteryMachine.ts`
- **문제**: CONFIRM_SETTINGS 액션에서 설정값 재검증 없음
- **수정 방안**: Reducer 내에서 validateSettings 호출 추가

### LOW 심각도

- prototype pollution 위험 없음 ✅
- XSS 취약점 없음 ✅
- 민감 데이터 노출 없음 ✅

---

## 2. Test Suite Report (테스트 스위트)

### Vitest 설정

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/**/*.ts', 'app/**/*.tsx'],
      exclude: ['app/components/ui/**'],
    },
  },
});
```

### 단위 테스트: lottery.ts

```typescript
// tests/lib/lottery.test.ts
import { describe, it, expect } from 'vitest';
import {
  getAvailableNumbers,
  getRandomNumber,
  getRandomNumbers,
  validateSettings,
} from '~/lib/lottery';

describe('getAvailableNumbers', () => {
  it('returns all numbers in range when no exclusions', () => {
    const result = getAvailableNumbers(1, 5, []);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('excludes specified numbers', () => {
    const result = getAvailableNumbers(1, 5, [2, 4]);
    expect(result).toEqual([1, 3, 5]);
  });

  it('returns empty array when all excluded', () => {
    const result = getAvailableNumbers(1, 3, [1, 2, 3]);
    expect(result).toEqual([]);
  });
});

describe('getRandomNumber', () => {
  it('returns number within range', () => {
    for (let i = 0; i < 100; i++) {
      const result = getRandomNumber(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it('handles single value range', () => {
    expect(getRandomNumber(5, 5)).toBe(5);
  });
});

describe('getRandomNumbers', () => {
  it('returns correct count of numbers', () => {
    const result = getRandomNumbers(1, 100, 5, []);
    expect(result).toHaveLength(5);
  });

  it('returns unique numbers when no duplicates allowed', () => {
    const result = getRandomNumbers(1, 10, 5, []);
    const unique = new Set(result);
    expect(unique.size).toBe(5);
  });

  it('respects exclusion list', () => {
    const excluded = [1, 2, 3];
    const result = getRandomNumbers(1, 10, 3, excluded);
    result.forEach(n => expect(excluded).not.toContain(n));
  });
});

describe('validateSettings', () => {
  it('validates correct settings', () => {
    const result = validateSettings({
      startNumber: 1,
      endNumber: 45,
      drawCount: 6,
      allowDuplicates: false,
    });
    expect(result.valid).toBe(true);
  });

  it('fails when start > end', () => {
    const result = validateSettings({
      startNumber: 45,
      endNumber: 1,
      drawCount: 6,
      allowDuplicates: false,
    });
    expect(result.valid).toBe(false);
  });

  it('fails when drawCount exceeds range without duplicates', () => {
    const result = validateSettings({
      startNumber: 1,
      endNumber: 5,
      drawCount: 10,
      allowDuplicates: false,
    });
    expect(result.valid).toBe(false);
  });
});
```

### 훅 테스트: useLotteryMachine

```typescript
// tests/hooks/useLotteryMachine.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLotteryMachine } from '~/hooks/useLotteryMachine';

describe('useLotteryMachine', () => {
  it('starts in initial phase', () => {
    const { result } = renderHook(() => useLotteryMachine());
    expect(result.current.state.phase).toBe('initial');
  });

  it('opens settings dialog', () => {
    const { result } = renderHook(() => useLotteryMachine());
    act(() => result.current.openSettings());
    expect(result.current.state.settingsOpen).toBe(true);
  });

  it('confirms settings and transitions to ready', () => {
    const { result } = renderHook(() => useLotteryMachine());
    act(() => result.current.openSettings());
    act(() => result.current.confirmSettings());
    expect(result.current.state.phase).toBe('ready');
  });

  it('calculates remaining count correctly', () => {
    const { result } = renderHook(() => useLotteryMachine());
    act(() => result.current.openSettings());
    act(() => result.current.confirmSettings());
    expect(result.current.remainingCount).toBe(45); // default 1-45
  });
});
```

### E2E 테스트 (Playwright)

```typescript
// tests/e2e/lottery.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Lucky Number Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete draw flow', async ({ page }) => {
    // 1. Initial screen
    await expect(page.getByText('행운의 숫자를')).toBeVisible();

    // 2. Open settings
    await page.getByRole('button', { name: /설정/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 3. Confirm settings
    await page.getByRole('button', { name: /확인/i }).click();

    // 4. Draw
    await page.getByRole('button', { name: /추첨/i }).click();

    // 5. Wait for animation (2s)
    await page.waitForTimeout(2500);

    // 6. Check result
    await expect(page.getByText(/번호가 선택되었습니다/)).toBeVisible();
  });
});
```

---

## 3. Performance Analysis Report (성능 분석)

### 번들 크기: ✅ GOOD
- React 19 + React Router 7: ~50KB gzipped
- shadcn/ui (tree-shakeable): ~15KB
- Total estimate: ~70KB gzipped

### 리렌더링 분석

#### 3.1 HistoryList Key 패턴
- **위치**: `app/components/lottery/HistoryList.tsx:23`
- **현재**: `key={num}` (중복 번호 시 문제)
- **수정 권장**:
```tsx
{history.map((num, index) => (
  <HistoryItem
    key={`${num}-${index}`}  // 고유 키 보장
    number={num}
    onRemove={() => onRestore(num)}
  />
))}
```

#### 3.2 Callback Memoization
- **위치**: `app/components/lottery/HistoryList.tsx`
- **현재**: `onRemove={() => onRestore(num)}` (매 렌더링 새 함수)
- **영향**: 작은 영향이지만 최적화 가능
- **수정 방안**: useCallback 사용 또는 HistoryItem에서 처리

### 애니메이션 성능: ✅ GOOD
- requestAnimationFrame 사용 ✅
- GPU 가속 transform 사용 ✅
- 메모리 누수 없음 (cleanup 정상) ✅

### 권장 사항

#### 3.3 pulse-ring 애니메이션 최적화
- **현재**: `box-shadow` 애니메이션 (리페인트 발생)
- **수정 방안**:
```css
@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
```

---

## Action Items (우선순위순)

### 즉시 수정 권장
1. [ ] NumberInput max 검증 추가 (HIGH)
2. [ ] 범위 최대값 상한선 설정 (HIGH)
3. [ ] HistoryList key 패턴 수정 (MEDIUM)

### 선택적 개선
4. [ ] Reducer 내 설정 검증 추가 (MEDIUM)
5. [ ] pulse-ring GPU 최적화 (LOW)
6. [ ] Vitest 테스트 스위트 구현 (Enhancement)

### 향후 고려
7. [ ] crypto.getRandomValues 전환 (복권/도박 앱인 경우만)

---

## Conclusion

행운번호 추첨기 MVP는 전반적으로 잘 구현되었습니다:

- **보안**: 입력 검증 강화 필요 (MEDIUM 위험)
- **테스트**: 기본 구조 제공됨, 구현 필요
- **성능**: 양호, 소소한 최적화 가능

권장 조치: HIGH 우선순위 항목 2개 수정 후 배포 진행
