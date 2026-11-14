// 아래에서 올라오는 선택 시트 (카드 2열 그리드)
import Modal, { SHEET } from './Modal';
export default function PickerSheet({ title, onClose, children }) {
  return (
    <Modal label={title} onClose={onClose} dismiss
      className={`${SHEET} max-h-[80dvh] overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]`}>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </Modal>
  );
}
