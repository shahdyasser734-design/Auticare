import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreeningLayout } from '../../layouts/ScreeningLayout';
import { Button } from '../../components/common/Button';
import { ScreeningProgress, ScreeningQuestion } from '../../components/screening/ScreeningComponents';
import { ROUTES } from '../../utils/constants';
import { screeningService } from '../../services/api/screening';
import type { ScreeningQuestion as IScreeningQuestion } from '../../types';
import { LoadingSpinner } from '../../components/common/Loading';
import { useAuth } from '../../context/useAuth';

/* ──────────────────────────────────────────────────────────
   10 HARDCODED QUESTIONS (spec-exact)
   Answers: Yes / Easy / YES = 1 | No / Difficult / NO = 0
   ────────────────────────────────────────────────────────── */
const LOCAL_QUESTIONS: IScreeningQuestion[] = [
  {
    id: '1',
    question: 'Does your child look at you when you call his/her name?',
    description: '',
    pageNumber: 1,
    options: [
      { id: 'q1_yes', label: 'Yes', value: 1 },
      { id: 'q1_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: '2',
    question: 'How easy is it for you to get eye contact with your child?',
    description: '',
    pageNumber: 2,
    options: [
      { id: 'q2_yes', label: 'Yes', value: 1 },
      { id: 'q2_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: '3',
    question: 'Does your child point to indicate that s/he wants something? (e.g. a toy that is out of reach)',
    description: '',
    pageNumber: 3,
    options: [
      { id: 'q3_yes', label: 'Yes', value: 1 },
      { id: 'q3_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: '4',
    question: 'Does your child point to share interest with you? (e.g. pointing at an interesting sight)',
    description: '',
    pageNumber: 4,
    options: [
      { id: 'q4_yes', label: 'Yes', value: 1 },
      { id: 'q4_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: '5',
    question: 'Does your child pretend? (e.g. care for dolls, talk on a toy phone)',
    description: '',
    pageNumber: 5,
    options: [
      { id: 'q5_yes', label: 'Yes', value: 1 },
      { id: 'q5_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: '6',
    question: 'Does your child follow where you are looking?',
    description: '',
    pageNumber: 6,
    options: [
      { id: 'q6_yes', label: 'Yes', value: 1 },
      { id: 'q6_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: '7',
    question: 'If you or someone else in the family is visibly upset, does your child show signs of wanting to comfort them?',
    description: '',
    pageNumber: 7,
    options: [
      { id: 'q7_yes', label: 'Yes', value: 1 },
      { id: 'q7_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: '8',
    question: 'Would you describe your child’s first words as:',
    description: '',
    pageNumber: 8,
    options: [
      { id: 'q8_yes', label: 'Yes', value: 1 },
      { id: 'q8_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: '9',
    question: 'Does your child use simple gestures? (e.g. wave goodbye)',
    description: '',
    pageNumber: 9,
    options: [
      { id: 'q9_yes', label: 'Yes', value: 1 },
      { id: 'q9_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: '10',
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<IScreeningQuestion[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>('');

  useEffect(() => {
    const initializeScreening = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const queryChildId = params.get('childId');
        const storedChildId = localStorage.getItem('latestChildId');
        const activeChildId = queryChildId || storedChildId;

        if (!activeChildId) {
          navigate(ROUTES.PARENT_ADD_CHILD, { replace: true });
          return;
        }

        // ── Guard: if screening already submitted for this child, go straight to the dashboard ──
        const alreadySubmitted = localStorage.getItem(`screeningSubmitted_${activeChildId}`) === 'true';
        if (alreadySubmitted) {
          navigate(ROUTES.PARENT_DASHBOARD + `?childId=${activeChildId}`, { replace: true });
          return;
        }

        setChildId(activeChildId);
        const storedChildName = localStorage.getItem('latestChildName');
        if (storedChildName) {
          setChildName(storedChildName);
        }

        // Try backend first, but only use it when it provides the full, expected question set.
        try {
          await screeningService.startScreening(activeChildId);
          const q = await screeningService.getQuestions();
          const hasValidRemoteQuestions =
            Array.isArray(q) &&
            q.length === LOCAL_QUESTIONS.length &&
            q.every((item) =>
              item &&
              typeof item.id === 'string' &&
              item.id.trim() !== '' &&
              typeof item.question === 'string' &&
              item.question.trim() !== '' &&
              Array.isArray(item.options) &&
              item.options.length > 0
            );
          if (hasValidRemoteQuestions) {
            setQuestions(q);
            return;
          }
        } catch {
          // Fall through to local questions
        }

        setQuestions(LOCAL_QUESTIONS);
      } catch (err) {
        setQuestions(LOCAL_QUESTIONS);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initializeScreening();
  }, [navigate]);

  if (loading) {
    return (
      <ScreeningLayout>
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-slate-400 text-sm animate-pulse">Preparing your screening session...</p>
        </div>
      </ScreeningLayout>
    );
  }

  if (error && questions.length === 0) {
    return (
      <ScreeningLayout>
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 p-8 rounded-3xl text-center max-w-md shadow-xl dark:shadow-none">
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
        // Build binary JSON answers: Yes/Easy/YES=1, No/Difficult/NO=0
        const payloadAnswers: Record<string, number> = Object.entries(answers).reduce((acc, [qId, optionId]) => {
          const q = questions.find((q) => String(q.id) === String(qId));
          const opt = q?.options.find((o) => String(o.id) === String(optionId));
          const answerValue = opt?.value ?? 0;
          acc[qId] = answerValue;
          return acc;
        }, {} as Record<string, number>);

        if (childId) {
          // Submit to backend — capture result from response
          let submitResult: Record<string, unknown> | null = null;
          try {
            const res = await screeningService.submitScreening(childId, payloadAnswers);
            submitResult = res as unknown as Record<string, unknown>;
            // Persist result so results page can read it instantly without re-fetching
            localStorage.setItem(`screeningResult_${childId}`, JSON.stringify(submitResult));
          } catch {
            // Store answers locally if backend fails
            localStorage.setItem(`screening_answers_${childId}`, JSON.stringify(payloadAnswers));
          }
          // Mark screening complete — MUST be set BEFORE navigate so the guard reads it
          if (user?.id) {
            localStorage.setItem(`screeningComplete_${user.id}`, 'true');
          }
          // Lock this child so re-visiting /screening redirects straight to results
          localStorage.setItem(`screeningSubmitted_${childId}`, 'true');
          console.log('Screening submitted. Result:', submitResult, '| Navigating to dashboard for child:', childId);
          navigate(ROUTES.PARENT_DASHBOARD + `?childId=${childId}`, { replace: true });
        } else {
          navigate(ROUTES.PARENT_ADD_CHILD);
        }
      } catch (err) {
        setError('Failed to submit answers. Please try again.');
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
    <ScreeningLayout>
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

        <div className="w-full mt-8 flex justify-between items-center bg-white dark:bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
          <Button
            onClick={handlePrevious}
            disabled={currentPage === 1 || submitting}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white border border-slate-300 dark:border-white/15 shadow-none disabled:opacity-30"
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
