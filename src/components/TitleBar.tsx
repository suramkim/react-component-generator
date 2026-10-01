interface TitleBarProps {
  title: string;
  id?: string;
  onClose?: () => void;
  closeLabel?: string;
}

export function TitleBar({ title, id, onClose, closeLabel = '닫기' }: TitleBarProps) {
  return (
    <div className="titlebar">
      {onClose && (
        <button
          type="button"
          className="titlebar-close"
          onClick={onClose}
          aria-label={closeLabel}
          title={closeLabel}
        />
      )}
      <h2 id={id} className="titlebar-title" title={title}>
        {title}
      </h2>
    </div>
  );
}
