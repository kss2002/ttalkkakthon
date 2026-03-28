function DesktopIcon({ icon, name, onOpen }) {
  return (
    <button className="desktop-icon" type="button" aria-label={name} onClick={onOpen}>
      <div className="desktop-icon__symbol" aria-hidden="true">
        {icon}
      </div>
      <span className="desktop-icon__label">{name}</span>
    </button>
  );
}

export default DesktopIcon;
