import { useNavigate } from 'react-router-dom';
import { ScreeningLayout } from '../../layouts/ScreeningLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';

export const ParentReScreening = () => {
  const navigate = useNavigate();

  const handleStartReScreening = () => {
    const childId = localStorage.getItem('latestChildId');
    if (childId) {
      localStorage.removeItem(`screeningSubmitted_${childId}`);
      localStorage.removeItem(`screeningResult_${childId}`);
      localStorage.removeItem(`screening_answers_${childId}`);
      navigate(`${ROUTES.PARENT_SCREENING}?childId=${childId}`);
    } else {
      navigate(ROUTES.PARENT_ADD_CHILD);
    }
  };

  return (
    <ScreeningLayout>
      <div className="max-w-2xl w-full">
        <Card className="bg-navy-900/90 backdrop-blur-md border-none shadow-2xl rounded-3xl text-center py-12 px-8">
          <div className="space-y-8">
            <div className="text-orange-500 text-6xl">🔄</div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-3">Ready to Re-take the Screening?</h1>
              <p className="text-slate-300 text-lg">
                Taking the screening again helps you see how your child’s progress changes over time.
              </p>
            </div>

            <div className="bg-navy-800/70 rounded-3xl p-6 text-left border border-orange-500/15 shadow-inner">
              <p className="font-semibold text-white">Why re-screen?</p>
              <ul className="space-y-3 text-slate-300 mt-4">
                <li className="flex items-start gap-3">
                  <span className="text-orange-400">✓</span>
                  <span>Track progress with fresh results</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400">✓</span>
                  <span>Receive updated guidance for your child's development</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400">✓</span>
                  <span>Compare the latest assessment with past screenings</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(ROUTES.PARENT_SCREENING_RESULTS)}
                className="text-white border-white/20 hover:bg-white/10 w-full sm:w-auto"
              >
                Back to Results
              </Button>
              <Button 
                onClick={handleStartReScreening}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold w-full sm:w-auto shadow-lg shadow-orange-500/25"
              >
                Start Re-Screening
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </ScreeningLayout>
  );
};
