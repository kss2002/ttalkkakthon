function XpLoadingDialog({
  title = 'Windows 로그인',
  message = '로그인 중..',
  cancelLabel = '취소',
  onCancel,
}) {
  return (
    <div className="xp-loading-overlay" role="presentation">
      <section
        className="xp-loading-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="xp-loading-title"
        aria-describedby="xp-loading-message"
      >
        <header className="xp-loading-dialog__titlebar">
          <span id="xp-loading-title">{title}</span>
        </header>

        <div className="xp-loading-dialog__content">
          <div className="xp-loading-dialog__spinner" aria-hidden="true">
            <span className="xp-loading-dialog__dot xp-loading-dialog__dot--1" />
            <span className="xp-loading-dialog__dot xp-loading-dialog__dot--2" />
            <span className="xp-loading-dialog__dot xp-loading-dialog__dot--3" />
          </div>
          <p id="xp-loading-message" className="xp-loading-dialog__message">
            {message}
          </p>
        </div>

        <footer className="xp-loading-dialog__actions">
          <button className="xp-loading-dialog__button" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default XpLoadingDialog;
