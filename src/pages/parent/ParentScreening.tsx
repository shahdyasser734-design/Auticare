import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreeningLayout } from '../../layouts/ScreeningLayout';
import { Button } from '../../components/common/Button';
import { ScreeningProgress, ScreeningQuestion } from '../../components/screening/ScreeningComponents';
import { ROUTES } from '../../utils/constants';
import { screeningService } from '../../services/api/screening';
import type { ScreeningQuestion as IScreeningQuestion } from '../../types';
import { LoadingSpinner } from '../../components/common/Loading';
import { useAuth } from '../../context/AuthContext';

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
      { id: 'q2_easy',      label: 'Easy',      value: 1 },
      { id: 'q2_difficult', label: 'Difficult', value: 0 },
    ],
  },
  {
    id: 'q3',
    question: 'Does your child point to indicate that s/he wants something?',
    description: '',
    pageNumber: 3,
    options: [
      { id: 'q3_yes', label: 'Yes', value: 1 },
      { id: 'q3_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q4',
    question: 'Does your child point to share interest with you?',
    description: '',
    pageNumber: 4,
    options: [
      { id: 'q4_yes', label: 'Yes', value: 1 },
      { id: 'q4_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q5',
    question: 'Does your child pretend?',
    description: 'For example, pretend to talk on the phone or care for a doll.',
    pageNumber: 5,
    options: [
      { id: 'q5_yes', label: 'Yes', value: 1 },
      { id: 'q5_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q6',
    question: 'Does your child follow where you are looking?',
    description: 'For example, if you look at a toy across the room, does your child look too?',
    pageNumber: 6,
    options: [
      { id: 'q6_yes', label: 'Yes', value: 1 },
      { id: 'q6_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q7',
    question: 'If someone is visibly upset, does your child try to comfort them?',
    description: '',
    pageNumber: 7,
    options: [
      { id: 'q7_yes', label: 'Yes', value: 1 },
      { id: 'q7_no',  label: 'No',  value: 0 },
    ],
  },
  {
    id: 'q8',
    question: "Would you describe your child's first words as:",
    description: '',
    pageNumber: 8,
    options: [
      { id: 'q8_yes', label: 'YES (simple words)',    value: 1 },
      { id: 'q8_no',  label: 'NO (complex phrases)',  value: 0 },
    ],
  },
  {
    id: 'q9',
    question: 'Does your child use simple gestures?',
    description: 'For example, waving goodbye or nodding.',
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<IScreeningQuestion[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const initializeScreening = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const childId = params.get('childId');

        if (childId) {
          // Try backend first
          try {
            await screeningService.startScreening(childId);
            const q = await screeningService.getQuestions();
            if (q && q.length > 0) {
              setQuestions(q);
              setLoading(false);
              return;
            }
          } catch {
            // Fall through to local questions
          }
        }

        // Use local hardcoded questions as fallback (or when no childId)
        setQuestions(LOCAL_QUESTIONS);
      } catch (err) {
        setQuestions(LOCAL_QUESTIONS);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initializeScreening();
  }, []);

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
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl text-center max-w-md">
          <div className="text-orange-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-slate-400 mb-6">{error}</p>
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
        const params = new URLSearchParams(window.location.search);
        const childId = params.get('childId');

        // Build binary JSON answers: Yes/Easy/YES=1, No/Difficult/NO=0
        const payloadAnswers = Object.entries(answers).map(([qId, optionId]) => {
          const q = questions.find((q) => String(q.id) === String(qId));
          const opt = q?.options.find((o) => String(o.id) === String(optionId));
          let answerValue = 0;
          if (opt) {
            if (typeof opt.value === 'number') {
              answerValue = opt.value;
            } else {
              const lbl = (opt.label || '').toLowerCase();
              answerValue = (lbl === 'yes' || lbl === 'easy' || lbl === 'yes (simple words)') ? 1 : 0;
            }
          }
          return { questionId: qId, answerValue };
        });

        if (childId) {
          // Submit to backend if childId is available
          try {
            await screeningService.submitScreening(childId, payloadAnswers);
          } catch {
            // Store locally if backend fails
            localStorage.setItem(`screening_answers_${childId}`, JSON.stringify(payloadAnswers));
          }
          // Mark screening complete for this user
          if (user?.id) {
            localStorage.setItem(`screeningComplete_${user.id}`, 'true');
          }
          navigate(ROUTES.PARENT_SCREENING_RESULTS + `?childId=${childId}`);
        } else {
          // No childId — save locally and go to add-child first
          localStorage.setItem('screening_answers_pending', JSON.stringify(payloadAnswers));
          if (user?.id) {
            localStorage.setItem(`screeningComplete_${user.id}`, 'true');
          }
          navigate(ROUTES.PARENT_HOME);
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

        <div className="w-full mt-8 flex justify-between items-center bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
          <Button
            onClick={handlePrevious}
            disabled={currentPage === 1 || submitting}
            className="bg-white/10 hover:bg-white/15 text-white border border-white/15 shadow-none disabled:opacity-30"
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
