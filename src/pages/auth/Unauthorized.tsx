import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

export const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-20">
        <Card className="text-center py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-danger-600">Unauthorized</p>
          <h1 className="text-4xl font-bold text-neutral-900 mt-4">Access denied</h1>
          <p className="mt-4 text-neutral-600">
            You do not have permission to view this page. Please sign in with an account that has the required access.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate('/')} variant="primary">
              Go to Home
            </Button>
            <Button onClick={() => navigate('/login')} variant="outline">
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
