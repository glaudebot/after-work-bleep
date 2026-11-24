import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { inToss } from './toss.js';
import { todayKey } from './time.js';

// 콘솔 > 광고 그룹 상세의 ID (M4.1-1). 비어 있으면 광고를 부르지 않는다.
export const AD_GROUP_ID = 'ait.v2.live.1f6901d9364e402a';
const KEY = 'bleep:lastAd';

/** 저장 결과와 마지막 광고 날짜로 지금 띄울지 (D-16: 하루 1번, 공유 취소면 안 띄움) */
export const adDue = (result, lastAd, now = new Date()) =>
  result !== 'cancelled' && lastAd !== todayKey(now);

// QA는 window.__BLEEP_ADS__로 SDK를 가짜로 바꾼다 (T-28, T-29)
const sdk = () =>
  (typeof window !== 'undefined' && window.__BLEEP_ADS__) ||
  (inToss && AD_GROUP_ID ? { id: AD_GROUP_ID, load: loadFullScreenAd, show: showFullScreenAd } : null);

const lastAd = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

// 같은 광고 그룹은 한 번에 하나만 미리 불러온다 (토스 문서)
let state = 'idle'; // idle | loading | ready
const listeners = new Set();
const setState = (s) => { state = s; listeners.forEach((f) => f()); };

// 저장 버튼에 "광고 보고"를 미리 보여 주기 위한 구독 (useSyncExternalStore).
// 예상 못 한 시점의 광고는 심사 반려 사유 (2026-11-24 심사, https://developers-apps-in-toss.toss.im/guide/monetization/in-app-ad.md "No Deception")
export const subscribeAd = (f) => { listeners.add(f); return () => listeners.delete(f); };
export const adReady = () => state === 'ready' && adDue('saved', lastAd());

/** 짤 만들기 화면을 열 때. 오늘 이미 봤으면 부르지 않는다 */
export function preloadAd() {
  const a = sdk();
  if (!a || state !== 'idle' || !adDue('saved', lastAd())) return;
  try {
    if (!a.load.isSupported()) return;
    setState('loading');
    a.load({
      options: { adGroupId: a.id },
      onEvent: (e) => { if (e.type === 'loaded') setState('ready'); },
      onError: () => setState('idle'),
    });
  } catch (e) {
    setState('idle');
    console.error(e);
  }
}

/** 저장이 끝난 뒤. 아직 안 불러와졌으면 기다리지 않고 넘어간다 */
export function showAdAfterSave(result) {
  const a = sdk();
  if (!a || state !== 'ready' || !adDue(result, lastAd())) return;
  try { localStorage.setItem(KEY, todayKey()); } catch { /* 저장 못 해도 광고는 띄운다 */ }
  setState('idle');
  try {
    a.show({ options: { adGroupId: a.id }, onEvent: () => {}, onError: (e) => console.error(e) });
  } catch (e) {
    console.error(e);
  }
}
