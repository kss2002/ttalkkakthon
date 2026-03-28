import { useEffect, useState } from 'react';
import Desktop from './components/Desktop/Desktop';
import RecycleBinPage from './components/Desktop/RecycleBinPage';
import XpAlertDialog from './components/Desktop/XpAlertDialog';
import Taskbar from './components/Taskbar/Taskbar';
import { desktopApps } from './data/desktopApps';

const randomReplies = ['이거 아뉜데 ㅋ', '응 아니야~', '아~~웃', '이거 아니라고 ㅋㅋ', '안돼 돌아가~', '바보ㅋㅋ'];

function normalizePath(pathname) {
  if (pathname === '/login') {
    return '/login';
  }

  if (pathname === '/check') {
    return '/check';
  }

  return '/';
}

function pickRandomLoginAppId(excludeId) {
  const candidates = desktopApps.filter((app) => app.id !== excludeId);
  const targetPool = candidates.length > 0 ? candidates : desktopApps;
  const nextIndex = Math.floor(Math.random() * targetPool.length);

  return targetPool[nextIndex].id;
}

function App() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const [isAlertVisible, setIsAlertVisible] = useState(true);
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

  const navigateTo = (nextPath) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }

    setCurrentPath(normalizePath(nextPath));
  };

  const refreshLoginApp = () => {
    setLoginAppId((currentId) => pickRandomLoginAppId(currentId));
  };

  const handleOpenApp = (app) => {
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

  return (
    <div className="xp-shell">
      {currentPath === '/' ? (
        <Desktop apps={desktopApps} onOpenApp={handleOpenApp} />
      ) : (
        <RecycleBinPage
          pageMode={currentPath}
          onNavigateToAccess={handleNavigateToAccess}
          onNavigateToLogin={handleNavigateToLogin}
          onReturn={handleReturnFromLogin}
        />
      )}
      {currentPath === '/' && isAlertVisible && (
        <XpAlertDialog
          title="Windows 경고"
          message={'특정 프로그램에 바이러스가 발견됐습니다!\n10분 내로 프로그램 안에 내 정보를 삭제하세요!'}
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
          initialPosition={{ x: 240, y: 120 }}
          onClose={() => setRandomReply('')}
        />
      )}
      <Taskbar />
    </div>
  );
}

export default App;
