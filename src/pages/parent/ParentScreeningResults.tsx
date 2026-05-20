import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ResultsSummary } from '../../components/screening/ResultsComponents';
import { ROUTES } from '../../utils/constants';
import { screeningService } from '../../services/api/screening';
import type { ScreeningResult } from '../../types';
import { LoadingSpinner } from '../../components/common/Loading';

export const ParentScreeningResults = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const childId = params.get('childId');
        if (!childId) {
          setResult(null);
          return;
        }
        const data = await screeningService.getResults(childId);
        if (data.length > 0) setResult(data[0]);
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
          <p className="mt-4 text-navy-600 font-medium">Loading your comprehensive results...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-navy-900 mb-2">Screening Results</h1>
          <p className="text-navy-500">
            Comprehensive medical-grade analysis of your child's screening session
          </p>
        </div>

        {!result ? (
          <Card className="bg-white border-none shadow-xl rounded-3xl">
            <div className="text-center py-16 space-y-6">
              <div className="text-6xl">📋</div>
              <p className="text-navy-600 text-lg">No screening results found.</p>
              <Button onClick={() => navigate(ROUTES.PARENT_SCREENING)} className="bg-orange-500 hover:bg-orange-600 px-8 py-3">
                Start Screening Now
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            <ResultsSummary result={result} />

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-soft-gray mt-8">
              <Button
                variant="outline"
                className="flex-1 py-4 text-navy-700 border-navy-200 hover:bg-navy-50"
                onClick={() => navigate(ROUTES.PARENT_RE_SCREENING)}
              >
                Take Screening Again
              </Button>
              <Button 
                className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25"
                onClick={() => navigate(ROUTES.PARENT_BOOK_SPECIALIST)}
              >
                Go to Specialists Page
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
