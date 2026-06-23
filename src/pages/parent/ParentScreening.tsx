import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScreeningLayout } from '../../layouts/ScreeningLayout';
import { Button } from '../../components/common/Button';
import { ScreeningProgress, ScreeningQuestion } from '../../components/screening/ScreeningComponents';
import { ROUTES } from '../../utils/constants';
import { screeningService, type BackendScreeningAnswer } from '../../services/api/screening';
import type { ScreeningQuestion as IScreeningQuestion } from '../../types';
import { LoadingSpinner } from '../../components/common/Loading';
import { useAuth } from '../../context/useAuth';
import { useModal } from '../../context/useModal';

/* ──────────────────────────────────────────────────────────
   10 HARDCODED QUESTIONS (spec-exact)
   Answers: Yes / Easy / YES = 1 | No / Difficult / NO = 0
   ────────────────────────────────────────────────────────── */
const LOCAL_QUESTIONS: IScreeningQuestion[] = [
  {
    id: 'q1',
    question: 'Does your child look at you when you call his/her name?',
    description: '',
    pageNumber: 1,
    options: [
      { id: 'q1_yes', label: 'Yes', value: 1 },
      { id: 'q1_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q2',
    question: 'How easy is it for you to get eye contact with your child?',
    description: '',
    pageNumber: 2,
    options: [
      { id: 'q2_yes', label: 'Yes', value: 1 },
      { id: 'q2_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q3',
    question: 'Does your child point to indicate that s/he wants something? (e.g. a toy that is out of reach)',
    description: '',
    pageNumber: 3,
    options: [
      { id: 'q3_yes', label: 'Yes', value: 1 },
      { id: 'q3_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q4',
    question: 'Does your child point to share interest with you? (e.g. pointing at an interesting sight)',
    description: '',
    pageNumber: 4,
    options: [
      { id: 'q4_yes', label: 'Yes', value: 1 },
      { id: 'q4_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q5',
    question: 'Does your child pretend? (e.g. care for dolls, talk on a toy phone)',
    description: '',
    pageNumber: 5,
    options: [
      { id: 'q5_yes', label: 'Yes', value: 1 },
      { id: 'q5_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q6',
    question: 'Does your child follow where you are looking?',
    description: '',
    pageNumber: 6,
    options: [
      { id: 'q6_yes', label: 'Yes', value: 1 },
      { id: 'q6_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q7',
    question: 'If you or someone else in the family is visibly upset, does your child show signs of wanting to comfort them?',
    description: '',
    pageNumber: 7,
    options: [
      { id: 'q7_yes', label: 'Yes', value: 1 },
      { id: 'q7_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q8',
    question: 'Would you describe your child’s first words as:',
    description: '',
    pageNumber: 8,
    options: [
      { id: 'q8_yes', label: 'YES — simple words like "mama", "bye"', value: 1 },
      { id: 'q8_no', label: 'NO — more complex phrases and sentence-like speech', value: 0 },
    ],
  },
  {
    id: 'q9',
    question: 'Does your child use simple gestures? (e.g. wave goodbye)',
    description: '',
    pageNumber: 9,
    options: [
      { id: 'q9_yes', label: 'Yes', value: 1 },
      { id: 'q9_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q10',
    question: 'Does your child stare at nothing with no apparent purpose?',
    description: '',
    pageNumber: 10,
    options: [
      { id: 'q10_yes', label: 'Yes', value: 1 },
      { id: 'q10_no',  label: 'No',  value: 0 },
    ],
  },
];

export const ParentScreening = () => {
  const navigate = useNavigate();
  const location = useLocation();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user, parentChildren, authInitialized, setActiveChildId } = useAuth() as any;
  const { showPrompt } = useModal();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<IScreeningQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>('');
  const [selectingChild, setSelectingChild] = useState(false);

  const confirmExit = async () => {
    return await showPrompt(
      <div className="space-y-3 text-left">
        <p className="text-base font-medium">Are you sure you want to leave the screening?</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">If you leave now, your current screening progress will be lost.</p>
      </div>,
      'Exit Screening'
    );
  };

  useEffect(() => {
    const initializeScreening = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const queryChildId = params.get('childId');
        
        let targetChildId = queryChildId;

        if (!targetChildId) {
          if (!parentChildren || parentChildren.length === 0) {
            navigate(ROUTES.PARENT_ADD_CHILD, { replace: true });
            return;
          } else if (parentChildren.length === 1) {
            targetChildId = parentChildren[0].id;
            if (setActiveChildId) setActiveChildId(targetChildId);
          } else {
            setSelectingChild(true);
            setLoading(false);
            return;
          }
        }
        
        setSelectingChild(false);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentChild = parentChildren?.find((c: any) => String(c.id) === String(targetChildId));
        if (!currentChild) {
          console.error("Unauthorized access to child profile for screening.");
          navigate(ROUTES.PARENT_HOME, { replace: true });
          return;
        }

        setChildId(targetChildId);
        const storedChildName = currentChild.name || localStorage.getItem('latestChildName');
        if (storedChildName) {
          setChildName(storedChildName);
        }

        // Try backend first, but only use it when it provides valid questions.
        try {
          const startRes = await screeningService.startScreening(targetChildId);
          if (startRes?.sessionId) setSessionId(startRes.sessionId);
          const q = startRes?.questions ?? (await screeningService.getQuestions());
          const hasValidQuestions =
            Array.isArray(q) &&
            q.length === LOCAL_QUESTIONS.length &&
            q.every((item) => Array.isArray(item.options) && item.options.length > 0 && typeof item.id === 'string');
          if (hasValidQuestions) {
            setQuestions(q);
            return;
          }
        } catch (backendError) {
          console.warn('Screening backend questions unavailable or invalid, using local questions.', backendError);
        }

        setQuestions(LOCAL_QUESTIONS);
      } catch (err) {
        setQuestions(LOCAL_QUESTIONS);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (!authInitialized) return;
    initializeScreening();
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, authInitialized, parentChildren, location.search]);

  if (loading) {
    return (
      <ScreeningLayout confirmExit={confirmExit}>
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-slate-400 text-sm animate-pulse">Preparing your screening session...</p>
        </div>
      </ScreeningLayout>
    );
  }

  if (selectingChild) {
    return (
      <ScreeningLayout confirmExit={confirmExit}>
        <div className="w-full max-w-2xl bg-white dark:bg-navy-800 p-8 rounded-2xl shadow-xl dark:shadow-none border border-slate-100 dark:border-white/5">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Select Child</h2>
          <p className="text-slate-500 mb-6">Which child would you like to perform the screening for?</p>
          <div className="grid gap-3">
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {parentChildren?.map((child: any) => (
              <Button
                key={child.id}
                onClick={() => {
                  if (setActiveChildId) setActiveChildId(child.id);
                  navigate(`${ROUTES.PARENT_SCREENING}?childId=${child.id}`, { replace: true });
                }}
                className="w-full justify-start text-left bg-slate-50 hover:bg-slate-100 text-slate-900 dark:bg-navy-700 dark:hover:bg-navy-600 dark:text-white border border-slate-200 dark:border-slate-600"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{child.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{child.gender} • {child.age} years old</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </ScreeningLayout>
    );
  }

  if (error && questions.length === 0) {
    return (
      <ScreeningLayout confirmExit={confirmExit}>
        <div className="bg-white dark:bg-navy-800 backdrop-blur-sm p-8 text-center max-w-md dark:shadow-none rounded-2xl">
          <div className="text-orange-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Oops!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </ScreeningLayout>
    );
  }

  const question = questions[currentPage - 1];
  const totalPages = questions.length;

  const handleSelectAnswer = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: optionId }));
  };

  const handleNext = async () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else {
      // Submit
      setSubmitting(true);
      try {
        const payloadAnswers = Object.entries(answers).map(([qId, optionId]) => {
          const q = questions.find((q) => String(q.id) === String(qId));
          const opt = q?.options.find((o) => String(o.id) === String(optionId));
          const answerValue = opt?.value ?? 0;
          const parsedQuestionId = Number(String(q?.id ?? qId).replace(/^q/i, ''));
          return {
            questionId: Number.isNaN(parsedQuestionId) ? 0 : parsedQuestionId,
            answerValue: answerValue,
          };
        });

        if (childId) {
          // Submit to backend — capture result from response
          let submitResult: Record<string, unknown> | null = null;
          try {
            // Prefer session-based submit if available
            let res;
            if (sessionId) {
              res = await screeningService.submitAnswers(sessionId, payloadAnswers as BackendScreeningAnswer[], childId);
            } else {
              // Fallback to legacy childId-based submit
              res = await screeningService.submitScreening(childId, payloadAnswers as BackendScreeningAnswer[]);
            }
            submitResult = res as unknown as Record<string, unknown>;
            localStorage.setItem(`screeningResult_${childId}`, JSON.stringify(submitResult));
          } catch (e) {
            localStorage.setItem(`screening_answers_${childId}`, JSON.stringify(payloadAnswers));
            console.error('Screening submit error', e);
            setError('Failed to submit screening. Please check your connection and try again.');
            setSubmitting(false);
            return;
          }

          if (user?.id) {
            localStorage.setItem(`screeningComplete_${user.id}`, 'true');
          }
          localStorage.setItem(`screeningSubmitted_${childId}`, 'true');
          console.log('Screening submitted. Result:', submitResult, '| Navigating to results for child:', childId);
          navigate(ROUTES.PARENT_SCREENING_RESULTS + `?childId=${childId}`, { replace: true });
        } else {
          navigate(ROUTES.PARENT_ADD_CHILD);
        }
      } catch (err) {
        setError('Failed to submit your screening. Please try again.');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <ScreeningLayout confirmExit={confirmExit}>
      <div className="w-full max-w-2xl flex flex-col items-center">
        <ScreeningProgress currentPage={currentPage} totalPages={totalPages} />
        {childName ? (
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Screening for {childName}
          </p>
        ) : null}

        <ScreeningQuestion
          question={question.question}
          description={question.description}
          options={question.options}
          selectedAnswer={answers[question.id]}
          onSelectAnswer={handleSelectAnswer}
          questionNumber={currentPage}
        />

        {error && (
          <div className="w-full mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="w-full mt-8 flex justify-between items-center bg-white dark:bg-navy-800 backdrop-blur-sm p-4 dark:shadow-none rounded-xl">
          <Button
            onClick={handlePrevious}
            disabled={currentPage === 1 || submitting}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-navy-700 dark:hover:bg-navy-600 dark:text-white border border-slate-300 dark:border-white/10 shadow-none disabled:opacity-30"
          >
            ← Previous
          </Button>

          <span className="text-slate-500 text-sm font-medium hidden sm:block">
            {currentPage} of {totalPages}
          </span>

          <Button
            onClick={handleNext}
            disabled={!answers[question.id] || submitting}
            isLoading={submitting}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 shadow-lg shadow-orange-500/25 disabled:opacity-50"
          >
            {currentPage === totalPages ? '✓ Submit Screening' : 'Continue →'}
          </Button>
        </div>
      </div>
    </ScreeningLayout>
  );
};
