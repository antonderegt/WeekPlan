import React, { useEffect } from 'react';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ title, isOpen, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          {onClose ? (
            <button type="button" className="ghost" onClick={onClose} aria-label="Close">
              x
            </button>
          ) : null}
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
