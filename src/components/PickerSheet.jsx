// 아래에서 올라오는 선택 시트 (카드 2열 그리드)
export default function PickerSheet({ title, onClose, children }) {
  return (
    <div role="dialog" aria-label={title} className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div className="max-h-[80dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold">{title}</h2>
        <div className="grid grid-cols-2 gap-3">{children}</div>
      </div>
    </div>
  );
}
