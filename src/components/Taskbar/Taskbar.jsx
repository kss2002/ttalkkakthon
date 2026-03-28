function Taskbar() {
  const now = new Date();

  const timeLabel = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <footer className="xp-taskbar" aria-label="Windows XP taskbar">
      <button className="start-button" type="button">
        Start
      </button>
      <div className="taskbar-items" aria-hidden="true">
        <span className="taskbar-item">Welcome</span>
        <span className="taskbar-item">Desktop</span>
      </div>
      <div className="taskbar-clock" aria-label={`Current time ${timeLabel}`}>
        {timeLabel}
      </div>
    </footer>
  );
}

export default Taskbar;
