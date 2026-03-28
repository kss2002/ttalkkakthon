function DesktopIcon({ icon, name }) {
  return (
    <button className="desktop-icon" type="button" aria-label={name}>
      <div className="desktop-icon__symbol" aria-hidden="true">
        {icon}
      </div>
      <span className="desktop-icon__label">{name}</span>
    </button>
  );
}

export default DesktopIcon;
