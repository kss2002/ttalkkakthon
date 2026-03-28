import { useState } from 'react';

function XpAlertDialog({ message, onClose }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (event) => {
    const startPoint = { x: event.clientX, y: event.clientY };
    const origin = { ...position };

    setIsDragging(true);

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startPoint.x;
      const deltaY = moveEvent.clientY - startPoint.y;
      setPosition({ x: origin.x + deltaX, y: origin.y + deltaY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className="xp-alert-overlay" role="presentation">
      <section
        className={`xp-alert${isDragging ? ' is-dragging' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="xp-alert-title"
        aria-describedby="xp-alert-message"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <header className="xp-alert__titlebar" onPointerDown={handlePointerDown}>
          <span id="xp-alert-title">Windows</span>
          <button
            className="xp-alert__close"
            type="button"
            aria-label="Close alert"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
          >
            X
          </button>
        </header>

        <div className="xp-alert__content">
          <div className="xp-alert__icon" aria-hidden="true">
            !
          </div>
          <p id="xp-alert-message" className="xp-alert__message">
            {message}
          </p>
        </div>

        <footer className="xp-alert__actions">
          <button className="xp-alert__button" type="button" onClick={onClose}>
            확인
          </button>
        </footer>
      </section>
    </div>
  );
}

export default XpAlertDialog;
