import './index.css';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';

function ModalLayout({ isOpen, title, children, footer, onClose, size = 'md' }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-layout" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal-layout__dialog modal-layout__dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {(title || onClose) && (
          <header className="modal-layout__header">
            {title && <h2 className="heading-sm">{title}</h2>}
            {onClose && (
              <button type="button" className="modal-layout__close" onClick={onClose} aria-label="Close dialog">
                <HiXMark />
              </button>
            )}
          </header>
        )}
        <div className="modal-layout__body">{children}</div>
        {footer && <footer className="modal-layout__footer">{footer}</footer>}
      </section>
    </div>,
    document.body
  );
}

export default ModalLayout;
