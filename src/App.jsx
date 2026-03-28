import { useEffect, useState } from 'react';
import Desktop from './components/Desktop/Desktop';
import RecycleBinPage from './components/Desktop/RecycleBinPage';
import XpAlertDialog from './components/Desktop/XpAlertDialog';
import XpCountdownTimer from './components/Desktop/XpCountdownTimer';
import Taskbar from './components/Taskbar/Taskbar';
import { desktopApps } from './data/desktopApps';

const randomReplies = ['이거 아뉜데 ㅋ', '응 아니야~', '아~~웃', '이거 아니라고 ㅋㅋ', '안돼 돌아가~', '바보ㅋㅋ'];
const APP_ROUTES = ['/virus', '/otp-success', '/otp', '/check', '/login'];

function getRemainingSeconds(timerDeadline) {
  if (timerDeadline === null) {
    return null;
  }

  return Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
}

function normalizePath(pathname) {
  return APP_ROUTES.find((route) => pathname === route || pathname.endsWith(route)) ?? '/';
}

function detectBasePath(pathname) {
  const matchedRoute = APP_ROUTES.find((route) => pathname === route || pathname.endsWith(route));

  if (matchedRoute) {
    return pathname.slice(0, pathname.length - matchedRoute.length) || '';
  }

  if (pathname === '/') {
    return '';
  }

  return pathname.replace(/\/$/, '');
}

function buildAppPath(basePath, routePath) {
  if (routePath === '/') {
    return basePath || '/';
  }

  return `${basePath}${routePath}`;
}

function pickRandomLoginAppId(excludeId) {
  const candidates = desktopApps.filter((app) => app.id !== excludeId);
  const targetPool = candidates.length > 0 ? candidates : desktopApps;
  const nextIndex = Math.floor(Math.random() * targetPool.length);

  return targetPool[nextIndex].id;
}

function App() {
  const [appBasePath] = useState(() => detectBasePath(window.location.pathname));
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  const [timerDeadline, setTimerDeadline] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [isTimeoutAlertVisible, setIsTimeoutAlertVisible] = useState(false);
  const [randomReply, setRandomReply] = useState('');
  const [randomReplyKey, setRandomReplyKey] = useState(0);
  const [loginAppId, setLoginAppId] = useState(() => pickRandomLoginAppId());

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = normalizePath(window.location.pathname);
      setCurrentPath(nextPath);

      if (nextPath === '/') {
        setLoginAppId((currentId) => pickRandomLoginAppId(currentId));
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (timerDeadline === null) {
      setTimerSeconds(null);
      return undefined;
    }

    const syncTimer = () => {
      const remainingSeconds = getRemainingSeconds(timerDeadline);
      setTimerSeconds(remainingSeconds);
    };

    syncTimer();

    if (timerDeadline <= Date.now()) {
      return undefined;
    }

    const intervalId = window.setInterval(syncTimer, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timerDeadline]);

  useEffect(() => {
    if (timerSeconds !== 0 || isTimeoutAlertVisible) {
      return undefined;
    }

    setIsTimeoutAlertVisible(true);

    return undefined;
  }, [isTimeoutAlertVisible, timerSeconds]);

  useEffect(() => {
    if (!isTimeoutAlertVisible) {
      return undefined;
    }

    const shutdownTimerId = window.setTimeout(() => {
      window.close();
      window.setTimeout(() => {
        window.location.replace('about:blank');
      }, 160);
    }, 1400);

    return () => {
      window.clearTimeout(shutdownTimerId);
    };
  }, [isTimeoutAlertVisible]);

  const navigateTo = (nextPath) => {
    const resolvedPath = buildAppPath(appBasePath, nextPath);

    if (window.location.pathname !== resolvedPath) {
      window.history.pushState({}, '', resolvedPath);
    }

    setCurrentPath(normalizePath(nextPath));
  };

  const refreshLoginApp = () => {
    setLoginAppId((currentId) => pickRandomLoginAppId(currentId));
  };

  const handleOpenApp = (app) => {
    if (isAlertVisible || randomReply) {
      return;
    }

    if (app.id === loginAppId) {
      setRandomReply('');
      navigateTo('/login');
      return;
    }

    const nextReply = randomReplies[Math.floor(Math.random() * randomReplies.length)];
    setRandomReply(nextReply);
    setRandomReplyKey((prev) => prev + 1);
  };

  const handleReturnFromLogin = () => {
    navigateTo('/');
    refreshLoginApp();
  };

  const handleNavigateToAccess = () => {
    navigateTo('/check');
  };

  const handleNavigateToLogin = () => {
    navigateTo('/login');
  };

  const handleNavigateToOtp = () => {
    navigateTo('/otp');
  };

  const handleNavigateToOtpSuccess = () => {
    navigateTo('/otp-success');
  };

  const handleNavigateToVirus = () => {
    navigateTo('/virus');
  };

  const handleInitialAlertConfirm = () => {
    setIsAlertVisible(false);
    setTimerDeadline(Date.now() + 600000);
  };

  return (
    <div className="xp-shell">
      {currentPath === '/' ? (
        <Desktop apps={desktopApps} onOpenApp={handleOpenApp} />
      ) : (
        <RecycleBinPage
          pageMode={currentPath}
          onNavigateToAccess={handleNavigateToAccess}
          onNavigateToLogin={handleNavigateToLogin}
          onNavigateToOtp={handleNavigateToOtp}
          onNavigateToOtpSuccess={handleNavigateToOtpSuccess}
          onNavigateToVirus={handleNavigateToVirus}
          onReturn={handleReturnFromLogin}
        />
      )}
      {currentPath === '/' && isAlertVisible && (
        <XpAlertDialog
          title="Windows 경고"
          message={'특정 프로그램에 바이러스가 발견됐습니다!\n10분 내로 프로그램 안에 내 정보를 삭제하세요!'}
          blockBackdrop
          onConfirm={handleInitialAlertConfirm}
          onClose={() => setIsAlertVisible(false)}
        />
      )}
      {currentPath === '/' && randomReply && (
        <XpAlertDialog
          key={randomReplyKey}
          title="Windows 메시지"
          message={randomReply}
          icon="?"
          confirmLabel="닫기"
          blockBackdrop
          initialPosition={{ x: 240, y: 120 }}
          onClose={() => setRandomReply('')}
        />
      )}
      {isTimeoutAlertVisible && (
        <XpAlertDialog
          title="Windows 종료 안내"
          message="시간 순삭 야르~"
          confirmLabel="종료"
          initialPosition={{ x: 220, y: 110 }}
          onConfirm={() => {
            window.close();
            window.setTimeout(() => {
              window.location.replace('about:blank');
            }, 160);
          }}
          onClose={() => {
            window.close();
            window.setTimeout(() => {
              window.location.replace('about:blank');
            }, 160);
          }}
        />
      )}
      {timerSeconds !== null && <XpCountdownTimer secondsRemaining={timerSeconds} />}
      <Taskbar />
    </div>
  );
}

export default App;
