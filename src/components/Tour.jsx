import { useTossBack } from '../lib/toss';

export const BUBBLE = 'whitespace-nowrap rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow';

// 첫 실행 안내 (M4-3): 홈 위를 어둡게 깔고 시계·도감·짤 버튼에 말풍선. 시계와 버튼은 App에서 z-50으로 올려 밝게 보이고, 시계 말풍선은 App이 시계 박스 바로 아래에 붙인다
export default function Tour({ onNext }) {
  useTossBack(onNext);
  return (
    <div role="dialog" aria-label="사용 안내" className="fixed inset-0 z-40 bg-black/60">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-8 text-center text-white">
        <p className="text-xl font-semibold">퇴근하면 하루에 한 번<br />세계의 재미있는 단어를 받아요</p>
        <button className="mt-6 rounded-xl bg-white px-10 py-3 font-semibold text-gray-900" onClick={onNext}>다음</button>
      </div>
      <div className="absolute inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex gap-2 px-5">
        <p className={`flex-[2] text-center ${BUBBLE}`}>단어 도감</p>
        <p className={`flex-[3] text-center ${BUBBLE}`}>단어로 짤 만들기</p>
      </div>
    </div>
  );
}
