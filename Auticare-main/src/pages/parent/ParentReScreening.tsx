import { useNavigate } from 'react-router-dom';
import { ScreeningLayout } from '../../layouts/ScreeningLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';

export const ParentReScreening = () => {
  const navigate = useNavigate();

  return (
    <ScreeningLayout>
      <div className="max-w-2xl w-full">
        <Card className="bg-navy-800/80 backdrop-blur-md border-none shadow-2xl rounded-3xl text-center py-12 px-8">
          <div className="space-y-8">
            <div className="text-orange-500 text-6xl">🔄</div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-3">Ready to Re-take the Screening?</h1>
              <p className="text-navy-300 text-lg">
                Taking the screening again can help track progress and show how your child's screening results have changed over time.
              </p>
            </div>

            <div className="bg-navy-900/50 rounded-2xl p-6 text-left space-y-4 border border-navy-700/50">
              <p className="font-semibold text-white">Benefits of Re-taking the Screening:</p>
              <ul className="space-y-3 text-navy-300">
                <li className="flex items-start gap-3">
                  <span className="text-orange-400">✓</span>
                  <span>Track progress and improvement over time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400">✓</span>
                  <span>Get updated recommendations based on current status</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400">✓</span>
                  <span>Compare results with previous screenings</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(ROUTES.PARENT_DASHBOARD)}
                className="text-navy-100 border-navy-500 hover:bg-navy-700 w-full sm:w-auto"
              >
                Back to Dashboard
              </Button>
              <Button 
                onClick={() => navigate(ROUTES.PARENT_SCREENING)}
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
