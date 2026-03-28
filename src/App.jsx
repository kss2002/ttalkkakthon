import { useState } from 'react';
import Desktop from './components/Desktop/Desktop';
import XpAlertDialog from './components/Desktop/XpAlertDialog';
import Taskbar from './components/Taskbar/Taskbar';
import { desktopApps } from './data/desktopApps';

function App() {
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  return (
    <div className="xp-shell">
      <Desktop apps={desktopApps} />
      {isAlertVisible && (
        <XpAlertDialog
          message="볼륨 소리가 이상합니다. 즉시 조치를 취하세요!"
          onClose={() => setIsAlertVisible(false)}
        />
      )}
      <Taskbar />
    </div>
  );
}

export default App;
