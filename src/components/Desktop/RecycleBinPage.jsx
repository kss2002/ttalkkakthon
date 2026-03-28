import { useEffect, useState } from 'react';
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

function RecycleBinPage({ pageMode, onNavigateToAccess, onNavigateToLogin, onReturn }) {
  const [loginMethod, setLoginMethod] = useState('certificate');
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

  const selectedCertificate = certificateOptions.find((item) => item.id === selectedCertificateId);
  const selectedAlternateLogin = alternateLoginOptions.find((item) => item.id === selectedAlternateId);
  const loginCertificate = certificateOptions.find((item) => item.id === loginCertificateId);
  const currentTerm = activeTerms[termsStepIndex];

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
          <button
            className="xp-recycle-window__nav"
            type="button"
            onClick={pageMode === '/check' ? onNavigateToLogin : onReturn}
          >
            Back
          </button>
          <div className="xp-recycle-window__path">{pageMode === '/check' ? '추가 확인' : '로그인'}</div>
        </div>

        <div className="xp-login-shell">
          <section className="xp-login-panel">
            <header className="xp-login-panel__titlebar">
              <span>{pageMode === '/check' ? '추가 확인 절차' : '보안 로그인'}</span>
            </header>

            <div className="xp-login-panel__body">
              {pageMode === '/login' ? (
                <>
                  <p className="xp-login-panel__eyebrow">Windows XP Secure Access</p>
                  <h2 className="xp-login-panel__heading">로그인 방식을 선택하세요</h2>
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
              ) : (
                <section className="xp-terms-page" aria-label="추가 확인 절차 페이지">
                  {!isTermsCompleted ? (
                    <>
                      <p className="xp-login-panel__eyebrow">Windows XP Secure Access</p>
                      <h2 className="xp-login-panel__heading">추가 확인 절차</h2>
                      <p className="xp-login-panel__description">
                        선택한 인증서로 로그인되었습니다. 준비된 50개 문항 중 10개가 랜덤으로 출제됩니다.
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
                            onClick={onNavigateToLogin}
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
                          추가 확인 절차가 끝났습니다. 필요하면 다시 처음부터 검토할 수 있습니다.
                        </p>
                        <div className="xp-terms-actions">
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
        {isAlternateLoading && <XpLoadingDialog onCancel={() => setIsAlternateLoading(false)} />}
      </section>
    </main>
  );
}

export default RecycleBinPage;
