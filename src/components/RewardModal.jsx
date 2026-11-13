import { useTossBack } from '../lib/toss';
export default function RewardModal({ oath, isNew, onMakeMeme, onClose }) {
  useTossBack(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center">
        <p className="text-sm text-gray-500">🎉 오늘도 퇴근 성공!</p>
        <p className="mt-2 text-xs text-gray-400">{oath.country}</p>
        <p className="mt-1 text-3xl font-black">{oath.word}</p>
        <p className="text-sm text-gray-500">{oath.original}</p>
        <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">{oath.meaning}</p>
        {isNew && <p className="mt-2 text-xs font-semibold text-blue-500">NEW! 도감에 등록됐어요</p>}
        <div className="mt-5 flex gap-2">
          <button className="flex-1 rounded-xl bg-gray-100 py-3" onClick={onClose}>닫기</button>
          <button className="flex-1 rounded-xl bg-blue-500 py-3 font-semibold text-white"
            onClick={onMakeMeme}>짤 만들기</button>
        </div>
      </div>
    </div>
  );
}
