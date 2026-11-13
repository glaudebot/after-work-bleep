// "HH:mm" → 오늘 날짜의 Date
const atToday = (hhmm, base = new Date()) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
};

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * 현재 근무 상태와 카운트다운 목표 시각 계산
 * - before: 출근 전 → 출근까지
 * - working: 근무 중 → 퇴근까지
 * - off: 퇴근 후 → 다음 출근까지
 * 야간 근무(퇴근 < 출근, 예: 22:00~06:00)도 처리
 */
export function getWorkPhase({ start, end }, now = new Date()) {
  let s = atToday(start, now);
  let e = atToday(end, now);

  if (e <= s) {
    // 야간 근무: 자정을 넘김
    if (now < e) s.setDate(s.getDate() - 1); // 어제 시작한 근무가 진행 중
    else if (now < s) return { phase: 'off', target: s, workEnd: e }; // 오늘 아침 퇴근 → 오늘 밤 출근까지
    else e.setDate(e.getDate() + 1);
  }

  if (now < s) return { phase: 'before', target: s, workEnd: e };
  if (now < e) return { phase: 'working', target: e, workEnd: e, workStart: s };

  const nextStart = new Date(s);
  nextStart.setDate(nextStart.getDate() + 1);
  return { phase: 'off', target: nextStart, workEnd: e };
}

export function splitMs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export const pad2 = (n) => String(n).padStart(2, '0');

// 복어 표정 단계 (D-18). 근무 중에는 근무 시간 중 지난 비율로 나눈다
export function getMood(work, now = new Date()) {
  if (work.phase === 'before') return 'sleepy';
  if (work.phase === 'off') return 'relieved';
  const p = (now - work.workStart) / (work.workEnd - work.workStart);
  return p < 0.5 ? 'calm' : p < 0.8 ? 'annoyed' : p < 0.95 ? 'angry' : 'furious';
}

// 배경 시간대 (D-18): 아침 06~11시, 점심 11~18시, 밤 18~06시
export function getDayPart(now = new Date()) {
  const h = now.getHours();
  return h >= 6 && h < 11 ? 'morning' : h >= 11 && h < 18 ? 'noon' : 'night';
}
