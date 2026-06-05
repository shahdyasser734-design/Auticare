import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <Card className="text-center max-w-md w-full">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Page Not Found</h1>
        <p className="text-neutral-600 mb-6">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Button fullWidth onClick={() => navigate(ROUTES.ROOT)}>
          Go Home
        </Button>
      </Card>
    </div>
  );
};
