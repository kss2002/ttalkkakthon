import { useEffect, useRef, useState } from 'react';
import { revisedTermsPool } from '../../data/revisedTermsQuestions';
import XpAlertDialog from './XpAlertDialog';
import XpLoadingDialog from './XpLoadingDialog';

const certificateOptions = [
  {
    id: 'personal',
    name: '개인 인증서',
    owner: '홍길동',
    issuedBy: 'Demo Secure CA',
    expiresAt: '2027-12-31',
    usage: '개인 확인 / 전자서명',
  },
  {
    id: 'work',
    name: '업무용 인증서',
    owner: 'TTalkkak Team',
    issuedBy: 'XP Trust Center',
    expiresAt: '2028-05-20',
    usage: '사내 로그인 / 문서 승인',
  },
  {
    id: 'device',
    name: '기기 인증서',
    owner: 'Desktop XP-01',
    issuedBy: 'Local Device Manager',
    expiresAt: '2026-11-14',
    usage: '디바이스 연결 / 보안 점검',
  },
];

const alternateLoginOptions = [
  {
    id: 'password',
    name: '아이디 로그인',
    description: '아이디와 접속 코드를 사용해 데모 로그인',
    hint: '권장 예시: demo_user / XP-2026',
  },
  {
    id: 'mobile',
    name: '모바일 확인',
    description: '휴대기기 승인 방식의 더미 화면',
    hint: '권장 예시: 010-1234-5678 / 482911',
  },
];

const TERMS_QUESTION_COUNT = 10;
const ERROR_POPUP_COUNT = 30;
const VIRUS_ERROR_POPUP_COUNT = 60;
const OTP_STEP_COUNT = 3;
const OTP_DIGIT_COUNT = 6;
const OTP_FLASH_DURATIONS = [1500, 1200, 800];
const VIRUS_FIELD_PADDING = 24;
const VIRUS_SPRITE_SIZE = 110;
const VIRUS_BUTTON_WIDTH = 148;
const VIRUS_BUTTON_HEIGHT = 38;
const VIRUS_ESCAPE_TRIGGER_RADIUS_FAST = 260;
const VIRUS_ESCAPE_TRIGGER_RADIUS_SLOW = 128;
const VIRUS_ESCAPE_DISTANCE_FAST = 232;
const VIRUS_ESCAPE_DISTANCE_SLOW = 102;
const VIRUS_ESCAPE_JITTER_FAST = 54;
const VIRUS_ESCAPE_JITTER_SLOW = 20;
const VIRUS_ESCAPE_COOLDOWN_SLOW = 220;
const VIRUS_CATCH_DISTANCE = 96;
const VIRUS_INVINCIBLE_MIN = 10000;
const VIRUS_INVINCIBLE_MAX = 15000;

function pickRandomCertificateId(excludeId) {
  const candidates = certificateOptions.filter((item) => item.id !== excludeId);
  const targetPool = candidates.length > 0 ? candidates : certificateOptions;
  const nextIndex = Math.floor(Math.random() * targetPool.length);

  return targetPool[nextIndex].id;
}

function pickRandomTermsSet() {
  const shuffledTerms = [...revisedTermsPool];

  for (let index = shuffledTerms.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledTerms[index], shuffledTerms[randomIndex]] = [shuffledTerms[randomIndex], shuffledTerms[index]];
  }

  return shuffledTerms.slice(0, TERMS_QUESTION_COUNT);
}

function pickReplacementTerm(activeTerms, replaceIndex, excludedIds = []) {
  const occupiedIds = new Set(activeTerms.map((term, index) => (index === replaceIndex ? null : term.id)).filter(Boolean));
  const blockedIds = new Set([...occupiedIds, ...excludedIds]);
  const candidates = revisedTermsPool.filter((term) => !blockedIds.has(term.id));

  if (candidates.length === 0) {
    return activeTerms[replaceIndex];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function pickRandomErrorTriggerStep() {
  return Math.floor(Math.random() * (TERMS_QUESTION_COUNT - 1)) + 1;
}

function createErrorPopups() {
  const homePromptIndex = Math.floor(ERROR_POPUP_COUNT / 2);

  return Array.from({ length: ERROR_POPUP_COUNT }, (_, index) => {
    const isHomePrompt = index === homePromptIndex;

    return {
      id: `error-popup-${Date.now()}-${index}`,
      message: isHomePrompt ? '홈에 돌아가시겠습니까?' : '다시 돌아가시겠습니까?',
      initialPosition: isHomePrompt
        ? { x: 0, y: 40 }
        : {
            x: Math.floor(Math.random() * 760) - 380,
            y: Math.floor(Math.random() * 420) - 110,
          },
      isHomePrompt,
    };
  });
}

function createVirusErrorPopups() {
  return Array.from({ length: VIRUS_ERROR_POPUP_COUNT }, (_, index) => ({
    id: `virus-error-${Date.now()}-${index}`,
    message: '시스템 오류가 발생했습니다!',
    initialPosition: {
      x: Math.floor(Math.random() * 920) - 460,
      y: Math.floor(Math.random() * 520) - 140,
    },
  }));
}

function createOtpSequence() {
  return Array.from({ length: OTP_DIGIT_COUNT }, () => Math.floor(Math.random() * 10).toString()).join('');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getRandomPosition(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function RecycleBinPage({
  pageMode,
  onNavigateToAccess,
  onNavigateToLogin,
  onNavigateToOtp,
  onNavigateToOtpSuccess,
  onNavigateToVirus,
  onReturn,
}) {
  const [loginMethod, setLoginMethod] = useState('alternate');
  const [selectedCertificateId, setSelectedCertificateId] = useState(certificateOptions[0].id);
  const [selectedAlternateId, setSelectedAlternateId] = useState(alternateLoginOptions[0].id);
  const [loginCertificateId, setLoginCertificateId] = useState(() => pickRandomCertificateId());
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [isAlternateLoading, setIsAlternateLoading] = useState(false);
  const [activeTerms, setActiveTerms] = useState(() => pickRandomTermsSet());
  const [errorTriggerStep, setErrorTriggerStep] = useState(() => pickRandomErrorTriggerStep());
  const [hasShownErrorBurst, setHasShownErrorBurst] = useState(false);
  const [errorPopups, setErrorPopups] = useState([]);
  const [termsStepIndex, setTermsStepIndex] = useState(0);
  const [termsSelectedOptionId, setTermsSelectedOptionId] = useState('');
  const [isTermsCompleted, setIsTermsCompleted] = useState(false);
  const [otpStepIndex, setOtpStepIndex] = useState(0);
  const [otpSequence, setOtpSequence] = useState(() => createOtpSequence());
  const [otpEnteredValue, setOtpEnteredValue] = useState('');
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [isOtpStepCleared, setIsOtpStepCleared] = useState(false);
  const [virusPosition, setVirusPosition] = useState({ x: 180, y: 120 });
  const [chaserPosition, setChaserPosition] = useState({ x: 90, y: 220 });
  const [isVirusCatchable, setIsVirusCatchable] = useState(false);
  const [isVirusRemoved, setIsVirusRemoved] = useState(false);
  const [virusErrorPopups, setVirusErrorPopups] = useState([]);
  const virusFieldRef = useRef(null);
  const virusPositionRef = useRef(virusPosition);
  const lastVirusEscapeAtRef = useRef(0);

  const selectedCertificate = certificateOptions.find((item) => item.id === selectedCertificateId);
  const selectedAlternateLogin = alternateLoginOptions.find((item) => item.id === selectedAlternateId);
  const loginCertificate = certificateOptions.find((item) => item.id === loginCertificateId);
  const currentTerm = activeTerms[termsStepIndex];
  const otpDigits = otpSequence.split('');
  const otpEnteredDigits = otpEnteredValue.split('');
  const currentOtpFlashDuration = OTP_FLASH_DURATIONS[otpStepIndex] ?? OTP_FLASH_DURATIONS[OTP_FLASH_DURATIONS.length - 1];
  const pageLabel =
    pageMode === '/virus'
      ? '바이러스 제거'
      : pageMode === '/otp-success'
        ? '간이 OTP 완료'
        : pageMode === '/otp'
          ? '간이 OTP'
          : pageMode === '/check'
            ? '추가 확인'
            : '로그인';
  const panelTitle =
    pageMode === '/virus'
      ? '바이러스 제거'
      : pageMode === '/otp-success'
      ? '간이 OTP 확인 완료'
      : pageMode === '/otp'
        ? '간이 OTP 확인'
        : pageMode === '/check'
          ? '추가 확인 절차'
          : '보안 로그인';
  const handleToolbarBack =
    pageMode === '/virus'
      ? onNavigateToOtpSuccess
      : pageMode === '/otp-success'
      ? onNavigateToOtp
      : pageMode === '/otp'
        ? onNavigateToAccess
        : pageMode === '/check'
          ? onNavigateToLogin
      : onReturn;
  const isVirusPage = pageMode === '/virus';

  useEffect(() => {
    virusPositionRef.current = virusPosition;
  }, [virusPosition]);

  useEffect(() => {
    if (pageMode === '/login') {
      setActiveTerms(pickRandomTermsSet());
      setErrorTriggerStep(pickRandomErrorTriggerStep());
      setHasShownErrorBurst(false);
      setErrorPopups([]);
      setTermsStepIndex(0);
      setTermsSelectedOptionId('');
      setIsTermsCompleted(false);
    }
  }, [pageMode]);

  useEffect(() => {
    if (pageMode === '/otp') {
      setOtpStepIndex(0);
      setOtpSequence(createOtpSequence());
      setOtpEnteredValue('');
      setIsOtpStepCleared(false);
    }
  }, [pageMode]);

  useEffect(() => {
    if (pageMode !== '/otp') {
      return undefined;
    }

    setIsOtpVisible(true);

    const timeoutId = window.setTimeout(() => {
      setIsOtpVisible(false);
    }, currentOtpFlashDuration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentOtpFlashDuration, otpSequence, pageMode]);

  useEffect(() => {
    if (pageMode !== '/virus') {
      setVirusErrorPopups([]);
      return undefined;
    }

    const invincibleDuration = getRandomPosition(VIRUS_INVINCIBLE_MIN, VIRUS_INVINCIBLE_MAX);
    setIsVirusCatchable(false);
    setIsVirusRemoved(false);
    lastVirusEscapeAtRef.current = 0;

    const placeVirusRandomly = () => {
      const virusField = virusFieldRef.current;

      if (!virusField) {
        return;
      }

      const bounds = virusField.getBoundingClientRect();
      const minX = VIRUS_FIELD_PADDING;
      const minY = VIRUS_FIELD_PADDING;
      const maxX = Math.max(minX, bounds.width - VIRUS_SPRITE_SIZE - VIRUS_FIELD_PADDING);
      const maxY = Math.max(minY, bounds.height - VIRUS_SPRITE_SIZE - VIRUS_FIELD_PADDING);
      const nextVirusPosition = {
        x: getRandomPosition(minX, maxX),
        y: getRandomPosition(minY, maxY),
      };
      const previousVirusPosition = virusPositionRef.current;
      const nextChaserPosition = {
        x: clamp(previousVirusPosition.x - 18, minX, Math.max(minX, bounds.width - VIRUS_BUTTON_WIDTH - VIRUS_FIELD_PADDING)),
        y: clamp(
          previousVirusPosition.y + 54,
          minY,
          Math.max(minY, bounds.height - VIRUS_BUTTON_HEIGHT - VIRUS_FIELD_PADDING),
        ),
      };

      setChaserPosition(nextChaserPosition);
      setVirusPosition(nextVirusPosition);
    };

    placeVirusRandomly();

    const catchableTimerId = window.setTimeout(() => {
      setIsVirusCatchable(true);
    }, invincibleDuration);

    const handleResize = () => {
      placeVirusRandomly();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.clearTimeout(catchableTimerId);
      window.removeEventListener('resize', handleResize);
    };
  }, [pageMode]);

  useEffect(() => {
    if (!isVirusRemoved || pageMode !== '/virus') {
      return undefined;
    }

    setVirusErrorPopups(createVirusErrorPopups());

    const timeoutId = window.setTimeout(() => {
      onReturn();
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isVirusRemoved, onReturn, pageMode]);

  const refreshLoginCertificate = () => {
    setLoginCertificateId((currentId) => pickRandomCertificateId(currentId));
  };

  const openFeedback = (message) => {
    setFeedbackMessage(message);
    setFeedbackKey((prev) => prev + 1);
  };

  const resetTermsFlow = () => {
    setActiveTerms(pickRandomTermsSet());
    setErrorTriggerStep(pickRandomErrorTriggerStep());
    setHasShownErrorBurst(false);
    setErrorPopups([]);
    setTermsStepIndex(0);
    setTermsSelectedOptionId('');
    setIsTermsCompleted(false);
  };

  const handleCertificateLogin = () => {
    if (selectedCertificateId === loginCertificateId) {
      resetTermsFlow();
      refreshLoginCertificate();
      onNavigateToAccess();
      return;
    }

    openFeedback(`로그인 인증서는 '${loginCertificate.name}' 인증서입니다.`);
    refreshLoginCertificate();
  };

  const handleCertificateSelect = (certificateId) => {
    setSelectedCertificateId(certificateId);
  };

  const handleAlternateLogin = () => {
    setIsAlternateLoading(true);
  };

  const openErrorBurst = () => {
    setErrorPopups(createErrorPopups());
    setHasShownErrorBurst(true);
  };

  const handleCloseErrorPopup = (popupId) => {
    setErrorPopups((currentPopups) => currentPopups.filter((popup) => popup.id !== popupId));
  };

  const resetTermsToStartWithFeedback = () => {
    openFeedback('답이 달라서 추가 확인 절차 첫 번째 문항으로 돌아갑니다.');
    resetTermsFlow();
  };

  const handleTermsOptionSelect = (optionId) => {
    if (termsStepIndex === TERMS_QUESTION_COUNT - 1) {
      setTermsSelectedOptionId(optionId);
      return;
    }

    if (optionId === currentTerm.correctOptionId) {
      const nextIndex = termsStepIndex + 1;
      setTermsStepIndex(nextIndex);
      setTermsSelectedOptionId('');

      if (!hasShownErrorBurst && nextIndex === errorTriggerStep) {
        openErrorBurst();
      }

      return;
    }

    resetTermsToStartWithFeedback();
  };

  const handleLastTermNext = () => {
    if (termsSelectedOptionId === currentTerm.correctOptionId) {
      setIsTermsCompleted(true);
      return;
    }

    resetTermsToStartWithFeedback();
  };

  const handleTermsPrevious = () => {
    if (termsStepIndex === 0) {
      return;
    }

    const previousIndex = termsStepIndex - 1;
    const nextTerms = [...activeTerms];
    const replacementTerm = pickReplacementTerm(nextTerms, previousIndex, [nextTerms[previousIndex].id, currentTerm.id]);

    nextTerms[previousIndex] = replacementTerm;
    setActiveTerms(nextTerms);
    setTermsStepIndex(previousIndex);
    setTermsSelectedOptionId('');
  };

  const handleOtpDigitClick = (digit) => {
    if (isOtpVisible || isOtpStepCleared || otpEnteredValue.length >= OTP_DIGIT_COUNT) {
      return;
    }

    const nextValue = `${otpEnteredValue}${digit}`;
    setOtpEnteredValue(nextValue);

    if (!otpSequence.startsWith(nextValue)) {
      openFeedback('숫자가 달라서 현재 간이 OTP 단계가 다시 시작됩니다.');
      setOtpEnteredValue('');
      setOtpSequence(createOtpSequence());
      setIsOtpStepCleared(false);
      return;
    }

    if (nextValue.length !== OTP_DIGIT_COUNT) {
      return;
    }

    if (nextValue === otpSequence) {
      setIsOtpStepCleared(true);
      return;
    }
  };

  const handleOtpBackspace = () => {
    if (isOtpVisible || isOtpStepCleared) {
      return;
    }

    setOtpEnteredValue((currentValue) => currentValue.slice(0, -1));
  };

  const handleOtpClear = () => {
    if (isOtpVisible || isOtpStepCleared) {
      return;
    }

    setOtpEnteredValue('');
  };

  const handleOtpNext = () => {
    if (!isOtpStepCleared) {
      return;
    }

    if (otpStepIndex === OTP_STEP_COUNT - 1) {
      onNavigateToOtpSuccess();
      return;
    }

    setOtpStepIndex((currentStep) => currentStep + 1);
    setOtpEnteredValue('');
    setOtpSequence(createOtpSequence());
    setIsOtpStepCleared(false);
  };

  const moveVirusAwayFrom = (threatX, threatY) => {
    const virusField = virusFieldRef.current;

    if (!virusField) {
      return;
    }

    const bounds = virusField.getBoundingClientRect();
    const currentVirusPosition = virusPositionRef.current;
    const minX = VIRUS_FIELD_PADDING;
    const minY = VIRUS_FIELD_PADDING;
    const maxX = Math.max(minX, bounds.width - VIRUS_SPRITE_SIZE - VIRUS_FIELD_PADDING);
    const maxY = Math.max(minY, bounds.height - VIRUS_SPRITE_SIZE - VIRUS_FIELD_PADDING);
    const maxChaserX = Math.max(minX, bounds.width - VIRUS_BUTTON_WIDTH - VIRUS_FIELD_PADDING);
    const maxChaserY = Math.max(minY, bounds.height - VIRUS_BUTTON_HEIGHT - VIRUS_FIELD_PADDING);
    const virusCenterX = currentVirusPosition.x + VIRUS_SPRITE_SIZE / 2;
    const virusCenterY = currentVirusPosition.y + VIRUS_SPRITE_SIZE / 2;
    const deltaX = virusCenterX - threatX;
    const deltaY = virusCenterY - threatY;
    const distance = Math.hypot(deltaX, deltaY) || 1;
    const triggerRadius = isVirusCatchable ? VIRUS_ESCAPE_TRIGGER_RADIUS_SLOW : VIRUS_ESCAPE_TRIGGER_RADIUS_FAST;

    if (distance > triggerRadius) {
      return;
    }

    const now = Date.now();

    if (isVirusCatchable && now - lastVirusEscapeAtRef.current < VIRUS_ESCAPE_COOLDOWN_SLOW) {
      return;
    }

    const unitX = deltaX / distance;
    const unitY = deltaY / distance;
    const baseJumpDistance = isVirusCatchable ? VIRUS_ESCAPE_DISTANCE_SLOW : VIRUS_ESCAPE_DISTANCE_FAST;
    const jumpDistance = isVirusCatchable
      ? Math.max(82, baseJumpDistance + (triggerRadius - distance) * 0.12)
      : Math.max(180, baseJumpDistance + (triggerRadius - distance) * 0.38);
    const jitter = isVirusCatchable ? VIRUS_ESCAPE_JITTER_SLOW : VIRUS_ESCAPE_JITTER_FAST;
    const nextVirusPosition = {
      x: clamp(currentVirusPosition.x + unitX * jumpDistance + (Math.random() * jitter * 2 - jitter), minX, maxX),
      y: clamp(currentVirusPosition.y + unitY * jumpDistance + (Math.random() * jitter * 2 - jitter), minY, maxY),
    };
    const chaseOffsetX = isVirusCatchable ? -8 : -24;
    const chaseOffsetY = isVirusCatchable ? 42 : 58;

    lastVirusEscapeAtRef.current = now;
    setChaserPosition({
      x: clamp(currentVirusPosition.x + chaseOffsetX, minX, maxChaserX),
      y: clamp(currentVirusPosition.y + chaseOffsetY, minY, maxChaserY),
    });
    setVirusPosition(nextVirusPosition);
  };

  const handleVirusRemoveAttempt = () => {
    if (isVirusRemoved) {
      return;
    }

    const currentPosition = virusPositionRef.current;
    const virusField = virusFieldRef.current;
    const bounds = virusField?.getBoundingClientRect();
    const minX = VIRUS_FIELD_PADDING;
    const minY = VIRUS_FIELD_PADDING;
    const maxChaserX = bounds
      ? Math.max(minX, bounds.width - VIRUS_BUTTON_WIDTH - VIRUS_FIELD_PADDING)
      : currentPosition.x;
    const maxChaserY = bounds
      ? Math.max(minY, bounds.height - VIRUS_BUTTON_HEIGHT - VIRUS_FIELD_PADDING)
      : currentPosition.y;

    setChaserPosition({
      x: clamp(currentPosition.x - 18, minX, maxChaserX),
      y: clamp(currentPosition.y + 36, minY, maxChaserY),
    });
    setIsVirusRemoved(true);
  };

  const handleVirusPointerMove = (event) => {
    if (!isVirusPage || isVirusRemoved) {
      return;
    }

    const virusField = virusFieldRef.current;

    if (!virusField) {
      return;
    }

    const bounds = virusField.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const pointerY = event.clientY - bounds.top;
    moveVirusAwayFrom(pointerX, pointerY);
  };

  return (
    <main className="xp-recycle-page">
      <section className="xp-recycle-window" aria-label="Login Center window">
        <header className="xp-recycle-window__titlebar">
          <span>Login Center</span>
          <button className="xp-recycle-window__close" type="button" onClick={onReturn}>
            X
          </button>
        </header>

        <div className="xp-recycle-window__toolbar">
          <button className="xp-recycle-window__nav" type="button" onClick={handleToolbarBack}>
            Back
          </button>
          <div className="xp-recycle-window__path">{pageLabel}</div>
        </div>

        <div className="xp-login-shell">
          <section className="xp-login-panel">
            <header className="xp-login-panel__titlebar">
              <span>{panelTitle}</span>
            </header>

            <div className="xp-login-panel__body">
              {pageMode === '/login' ? (
                <>
                  <p className="xp-login-panel__eyebrow">Windows XP Secure Access</p>
                  <h2 className="xp-login-panel__heading">로그인 방식을 선택해주세요.</h2>
                  <p className="xp-login-panel__description">
                    윈도우 XP 알림창과 비슷한 톤의 더미 로그인 화면입니다. 아래 버튼으로 인증서 로그인과 다른
                    로그인 방식을 전환할 수 있습니다.
                  </p>

                  <div className="xp-login-methods" role="tablist" aria-label="로그인 방식 선택">
                    <button
                      className={`xp-login-method${loginMethod === 'certificate' ? ' is-active' : ''}`}
                      type="button"
                      role="tab"
                      aria-selected={loginMethod === 'certificate'}
                      onClick={() => setLoginMethod('certificate')}
                    >
                      인증서 로그인
                    </button>
                    <button
                      className={`xp-login-method${loginMethod === 'alternate' ? ' is-active' : ''}`}
                      type="button"
                      role="tab"
                      aria-selected={loginMethod === 'alternate'}
                      onClick={() => setLoginMethod('alternate')}
                    >
                      다른 로그인
                    </button>
                  </div>

                  {loginMethod === 'certificate' ? (
                    <div className="xp-login-tab" role="tabpanel" aria-label="인증서 로그인 탭">
                      <div className="xp-login-list">
                        {certificateOptions.map((item) => (
                          <button
                            key={item.id}
                            className={`xp-login-item${selectedCertificateId === item.id ? ' is-selected' : ''}`}
                            type="button"
                            onClick={() => handleCertificateSelect(item.id)}
                          >
                            <span className="xp-login-item__name">{item.name}</span>
                            <span className="xp-login-item__meta">{item.owner}</span>
                          </button>
                        ))}
                      </div>

                      <aside className="xp-login-detail">
                        <h3 className="xp-login-detail__title">선택한 인증서</h3>
                        <div className="xp-login-detail__grid">
                          <div className="xp-login-detail__row">
                            <span className="xp-login-detail__label">소유자</span>
                            <span className="xp-login-detail__value">{selectedCertificate.owner}</span>
                          </div>
                          <div className="xp-login-detail__row">
                            <span className="xp-login-detail__label">발급기관</span>
                            <span className="xp-login-detail__value">{selectedCertificate.issuedBy}</span>
                          </div>
                          <div className="xp-login-detail__row">
                            <span className="xp-login-detail__label">만료일</span>
                            <span className="xp-login-detail__value">{selectedCertificate.expiresAt}</span>
                          </div>
                          <div className="xp-login-detail__row">
                            <span className="xp-login-detail__label">사용범위</span>
                            <span className="xp-login-detail__value">{selectedCertificate.usage}</span>
                          </div>
                        </div>

                        <button className="xp-login-detail__action" type="button" onClick={handleCertificateLogin}>
                          선택한 인증서로 로그인
                        </button>
                      </aside>
                    </div>
                  ) : (
                    <div className="xp-login-tab" role="tabpanel" aria-label="다른 로그인 탭">
                      <div className="xp-login-list">
                        {alternateLoginOptions.map((item) => (
                          <button
                            key={item.id}
                            className={`xp-login-item${selectedAlternateId === item.id ? ' is-selected' : ''}`}
                            type="button"
                            onClick={() => setSelectedAlternateId(item.id)}
                          >
                            <span className="xp-login-item__name">{item.name}</span>
                            <span className="xp-login-item__meta">{item.description}</span>
                          </button>
                        ))}
                      </div>

                      <aside className="xp-login-detail">
                        <h3 className="xp-login-detail__title">{selectedAlternateLogin.name}</h3>
                        <p className="xp-login-detail__hint">{selectedAlternateLogin.hint}</p>

                        <label className="xp-login-detail__field">
                          <span>아이디</span>
                          <input className="xp-login-detail__input" value="demo_user" readOnly />
                        </label>
                        <label className="xp-login-detail__field">
                          <span>접속 코드</span>
                          <input className="xp-login-detail__input" value="XP-2026" readOnly />
                        </label>

                        <button className="xp-login-detail__action" type="button" onClick={handleAlternateLogin}>
                          다른 방식으로 로그인
                        </button>
                      </aside>
                    </div>
                  )}
                </>
              ) : pageMode === '/check' ? (
                <section className="xp-terms-page" aria-label="추가 확인 절차 페이지">
                  {!isTermsCompleted ? (
                    <>
                      <p className="xp-login-panel__eyebrow">Windows XP Secure Access</p>
                      <h2 className="xp-login-panel__heading">추가 확인 절차</h2>
                      <p className="xp-login-panel__description">
                        선택한 인증서로 로그인되었습니다. 준비된 10개 문항이 랜덤으로 출제됩니다.
                      </p>

                      <div className="xp-terms-card">
                        <div className="xp-terms-card__summary">
                          <span className="xp-terms-card__summary-label">로그인 인증서</span>
                          <strong className="xp-terms-card__summary-value">{selectedCertificate.name}</strong>
                        </div>

                        <div className="xp-terms-progress">
                          <span className="xp-terms-progress__text">
                            {termsStepIndex + 1} / {TERMS_QUESTION_COUNT}
                          </span>
                          <div className="xp-terms-progress__bar" aria-hidden="true">
                            <span style={{ width: `${((termsStepIndex + 1) / TERMS_QUESTION_COUNT) * 100}%` }} />
                          </div>
                        </div>

                        <div className="xp-terms-question">
                          <h3 className="xp-terms-question__title">
                            {termsStepIndex + 1}. {currentTerm.title}
                          </h3>
                          <p className="xp-terms-question__description">{currentTerm.description}</p>
                          <div className="xp-terms-question__highlight">{currentTerm.highlight}</div>
                          <p className="xp-terms-question__prompt">{currentTerm.question}</p>
                        </div>

                        <div className="xp-terms-list">
                          {currentTerm.options.map((option) => (
                            <button
                              key={option.id}
                              className={`xp-terms-option${termsSelectedOptionId === option.id ? ' is-selected' : ''}`}
                              type="button"
                              onClick={() => handleTermsOptionSelect(option.id)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        <div className="xp-terms-actions">
                          <button
                            className="xp-login-detail__action xp-login-detail__action--secondary"
                            type="button"
                            disabled={termsStepIndex === 0}
                            onClick={handleTermsPrevious}
                          >
                            이전으로
                          </button>
                          {termsStepIndex === TERMS_QUESTION_COUNT - 1 && (
                            <button
                              className="xp-login-detail__action"
                              type="button"
                              disabled={!termsSelectedOptionId}
                              onClick={handleLastTermNext}
                            >
                              다음
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="xp-terms-card">
                      <div className="xp-terms-card__summary">
                        <span className="xp-terms-card__summary-label">완료 상태</span>
                        <strong className="xp-terms-card__summary-value">추가 확인 절차 완료</strong>
                      </div>

                      <div className="xp-terms-complete">
                        <h3 className="xp-terms-question__title">모든 문항을 통과했습니다.</h3>
                        <p className="xp-terms-question__description">
                          추가 확인 절차가 끝났습니다. 다음 단계로 간이 OTP 확인 페이지에 들어갈 수 있습니다.
                        </p>
                        <div className="xp-terms-actions">
                          <button className="xp-login-detail__action" type="button" onClick={onNavigateToOtp}>
                            간이 OTP로 이동
                          </button>
                          <button
                            className="xp-login-detail__action xp-login-detail__action--secondary"
                            type="button"
                            onClick={onNavigateToLogin}
                          >
                            로그인 화면으로
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              ) : pageMode === '/otp' ? (
                <section className="xp-terms-page" aria-label="간이 OTP 페이지">
                  <p className="xp-login-panel__eyebrow">Windows XP Secure Access</p>
                  <h2 className="xp-login-panel__heading">간이 OTP 확인</h2>
                  <p className="xp-login-panel__description">
                    6자리 숫자가 단계마다 다른 속도로 잠깐 나타납니다. 정답 입력 후에는 하단 `다음` 버튼을
                    눌러 다음 단계로 이동합니다.
                  </p>

                  <div className="xp-otp-card">
                    <div className="xp-terms-card__summary">
                      <span className="xp-terms-card__summary-label">진행 단계</span>
                      <strong className="xp-terms-card__summary-value">
                        {otpStepIndex + 1} / {OTP_STEP_COUNT}
                      </strong>
                    </div>

                    <div className="xp-terms-progress">
                      <span className="xp-terms-progress__text">간이 OTP 확인 진행률</span>
                      <div className="xp-terms-progress__bar" aria-hidden="true">
                        <span style={{ width: `${((otpStepIndex + 1) / OTP_STEP_COUNT) * 100}%` }} />
                      </div>
                    </div>

                    <div className="xp-otp-stage">
                      <div className="xp-otp-stage__header">
                        <h3 className="xp-terms-question__title">{otpStepIndex + 1}단계 숫자 확인</h3>
                        <span className="xp-otp-stage__status">
                          {isOtpVisible
                            ? `${(currentOtpFlashDuration / 1000).toFixed(1)}초 표시 중`
                            : isOtpStepCleared
                              ? '입력 완료, 다음 버튼을 눌러 진행'
                              : `${otpEnteredValue.length} / ${OTP_DIGIT_COUNT} 입력됨`}
                        </span>
                      </div>

                      <div className="xp-otp-display" aria-live="polite">
                        {otpDigits.map((digit, index) => (
                          <span
                            key={`${otpSequence}-${index}`}
                            className={`xp-otp-display__digit${isOtpVisible ? ' is-visible' : ''}${
                              !isOtpVisible && otpEnteredDigits[index] ? ' is-entered' : ''
                            }`}
                          >
                            {isOtpVisible ? digit : otpEnteredDigits[index] ?? ''}
                          </span>
                        ))}
                      </div>

                      <p className="xp-otp-stage__description">
                        {isOtpVisible
                          ? '숫자를 빠르게 기억해 주세요. 잠시 후 자동으로 사라집니다.'
                          : isOtpStepCleared
                            ? '입력이 확인되었습니다. 하단 다음 버튼을 눌러 다음 단계로 넘어가세요.'
                            : '아래 숫자 버튼을 눌러 방금 본 6자리 숫자를 다시 입력하세요.'}
                      </p>

                      <div className="xp-otp-keypad" role="group" aria-label="숫자 입력 키패드">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
                          <button
                            key={digit}
                            className="xp-otp-keypad__button"
                            type="button"
                            disabled={isOtpVisible || isOtpStepCleared}
                            onClick={() => handleOtpDigitClick(String(digit))}
                          >
                            {digit}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="xp-terms-actions">
                      <button
                        className="xp-login-detail__action xp-login-detail__action--secondary"
                        type="button"
                        disabled={isOtpVisible || !otpEnteredValue || isOtpStepCleared}
                        onClick={handleOtpBackspace}
                      >
                        한 칸 삭제
                      </button>
                      <button
                        className="xp-login-detail__action xp-login-detail__action--secondary"
                        type="button"
                        disabled={isOtpVisible || !otpEnteredValue || isOtpStepCleared}
                        onClick={handleOtpClear}
                      >
                        전체 지우기
                      </button>
                      <button
                        className="xp-login-detail__action"
                        type="button"
                        disabled={!isOtpStepCleared}
                        onClick={handleOtpNext}
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </section>
              ) : pageMode === '/otp-success' ? (
                <section className="xp-terms-page" aria-label="간이 OTP 완료 페이지">
                  <div className="xp-terms-card">
                    <div className="xp-terms-card__summary">
                      <span className="xp-terms-card__summary-label">완료 상태</span>
                      <strong className="xp-terms-card__summary-value">간이 OTP 확인 완료</strong>
                    </div>

                    <div className="xp-terms-complete">
                      <h3 className="xp-terms-question__title">간이 OTP 확인 완료</h3>
                      <p className="xp-terms-question__description">
                        간이 OTP 3단계 확인이 끝났습니다. 바이러스를 제거하시려면 제거하기 버튼을
                        클릭해주세요.
                      </p>
                      <div className="xp-terms-actions">
                        <button
                          className="xp-login-detail__action xp-login-detail__action--secondary"
                          type="button"
                          onClick={onReturn}
                        >
                          홈으로
                        </button>
                        <button className="xp-login-detail__action" type="button" onClick={onNavigateToVirus}>
                          제거하기
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="xp-virus-page" aria-label="바이러스 제거 페이지">
                  <div
                    className={`xp-virus-board${isVirusCatchable ? ' is-catchable' : ' is-escaping'}${
                      isVirusRemoved ? ' is-removed' : ''
                    }`}
                    ref={virusFieldRef}
                    onPointerMove={handleVirusPointerMove}
                  >
                    <div
                      className={`xp-virus-sprite${isVirusCatchable ? ' is-catchable' : ''}${isVirusRemoved ? ' is-removed' : ''}`}
                      style={{ transform: `translate(${virusPosition.x}px, ${virusPosition.y}px)` }}
                      aria-hidden="true"
                    >
                      <div className="xp-virus-character">
                        <span className="xp-virus-character__spike xp-virus-character__spike--1" />
                        <span className="xp-virus-character__spike xp-virus-character__spike--2" />
                        <span className="xp-virus-character__spike xp-virus-character__spike--3" />
                        <span className="xp-virus-character__spike xp-virus-character__spike--4" />
                        <span className="xp-virus-character__spike xp-virus-character__spike--5" />
                        <span className="xp-virus-character__spike xp-virus-character__spike--6" />
                        <span className="xp-virus-character__eye xp-virus-character__eye--left" />
                        <span className="xp-virus-character__eye xp-virus-character__eye--right" />
                        <span className="xp-virus-character__cheek xp-virus-character__cheek--left" />
                        <span className="xp-virus-character__cheek xp-virus-character__cheek--right" />
                        <span className="xp-virus-character__mouth" />
                      </div>
                    </div>

                    <button
                      className={`xp-virus-chaser${isVirusCatchable ? ' is-catchable' : ''}${isVirusRemoved ? ' is-removed' : ''}`}
                      type="button"
                      disabled={isVirusRemoved}
                      style={{ transform: `translate(${chaserPosition.x}px, ${chaserPosition.y}px)` }}
                      onClick={handleVirusRemoveAttempt}
                    >
                      {isVirusRemoved ? '제거 완료' : '제거하기'}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </section>
        </div>
        {feedbackMessage && (
          <XpAlertDialog
            key={feedbackKey}
            title="Windows 메시지"
            message={feedbackMessage}
            icon="!"
            confirmLabel="확인"
            initialPosition={{ x: 140, y: 60 }}
            onClose={() => setFeedbackMessage('')}
          />
        )}
        {errorPopups.map((popup) => (
          <XpAlertDialog
            key={popup.id}
            title="Windows 오류"
            message={popup.message}
            icon="!"
            confirmLabel="확인"
            initialPosition={popup.initialPosition}
            onConfirm={popup.isHomePrompt ? onReturn : () => handleCloseErrorPopup(popup.id)}
            onClose={() => handleCloseErrorPopup(popup.id)}
          />
        ))}
        {virusErrorPopups.map((popup) => (
          <XpAlertDialog
            key={popup.id}
            title="Windows 오류"
            message={popup.message}
            icon="!"
            confirmLabel="확인"
            initialPosition={popup.initialPosition}
            onClose={() => {}}
          />
        ))}
        {isAlternateLoading && <XpLoadingDialog onCancel={() => setIsAlternateLoading(false)} />}
      </section>
    </main>
  );
}

export default RecycleBinPage;
