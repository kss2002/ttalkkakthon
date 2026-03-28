import { createPortal } from 'react-dom';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function XpCountdownTimer({ secondsRemaining }) {
  const isUrgent = secondsRemaining <= 180;

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <aside className="xp-countdown-timer" aria-label={`남은 시간 ${formatTime(secondsRemaining)}`}>
      <span className="xp-countdown-timer__label">남은 시간</span>
      <strong className={`xp-countdown-timer__value${isUrgent ? ' is-urgent' : ''}`}>
        {formatTime(secondsRemaining)}
      </strong>
    </aside>,
    document.body,
  );
}

export default XpCountdownTimer;
