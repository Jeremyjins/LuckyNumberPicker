/**
 * 행운번호 추첨 로직 유틸리티
 */

/** 최대 허용 범위 (메모리 보호) */
export const MAX_RANGE = 10000;

/**
 * 사용 가능한 번호 목록 반환
 */
export function getAvailableNumbers(
  start: number,
  end: number,
  excluded: number[] = []
): number[] {
  const available: number[] = [];
  for (let i = start; i <= end; i++) {
    if (!excluded.includes(i)) {
      available.push(i);
    }
  }
  return available;
}

/**
 * 범위 내 랜덤 숫자 하나 반환
 * @returns 랜덤 숫자 또는 사용 가능한 숫자가 없으면 null
 */
export function getRandomNumber(
  start: number,
  end: number,
  excluded: number[] = []
): number | null {
  const available = getAvailableNumbers(start, end, excluded);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * 범위 내 랜덤 숫자 여러 개 반환 (Fisher-Yates 기반)
 */
export function getRandomNumbers(
  start: number,
  end: number,
  count: number,
  excluded: number[] = [],
  allowDuplicates: boolean = false
): number[] {
  const result: number[] = [];
  const tempExcluded = [...excluded];

  for (let i = 0; i < count; i++) {
    const num = getRandomNumber(start, end, allowDuplicates ? excluded : tempExcluded);
    if (num === null) break;
    result.push(num);
    if (!allowDuplicates) {
      tempExcluded.push(num);
    }
  }

  return result;
}

/**
 * 총 범위 계산
 */
export function getTotalRange(start: number, end: number): number {
  return Math.max(0, end - start + 1);
}

/**
 * 남은 번호 개수 계산
 */
export function getRemainingCount(
  start: number,
  end: number,
  excluded: number[],
  allowDuplicates: boolean
): number {
  if (allowDuplicates) {
    return getTotalRange(start, end);
  }
  return getAvailableNumbers(start, end, excluded).length;
}

/**
 * 추첨 가능 여부 확인
 */
export function canDraw(
  start: number,
  end: number,
  drawCount: number,
  excluded: number[],
  allowDuplicates: boolean
): boolean {
  const remaining = getRemainingCount(start, end, excluded, allowDuplicates);
  return remaining >= drawCount;
}

/**
 * 설정 유효성 검사
 */
export function validateSettings(settings: {
  startNumber: number;
  endNumber: number;
  drawCount: number;
}): { valid: boolean; error?: string } {
  const { startNumber, endNumber, drawCount } = settings;

  if (startNumber > endNumber) {
    return { valid: false, error: '시작 번호는 종료 번호보다 작거나 같아야 합니다.' };
  }

  if (drawCount < 1) {
    return { valid: false, error: '추첨 개수는 1 이상이어야 합니다.' };
  }

  const range = endNumber - startNumber + 1;

  // 최대 범위 검증 (메모리 보호)
  if (range > MAX_RANGE) {
    return {
      valid: false,
      error: `범위가 너무 큽니다. 최대 ${MAX_RANGE.toLocaleString()}개까지 가능합니다.`,
    };
  }

  if (drawCount > range) {
    return { valid: false, error: `추첨 개수는 범위(${range})를 초과할 수 없습니다.` };
  }

  return { valid: true };
}
