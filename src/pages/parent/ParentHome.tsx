import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { DashboardStats, UpcomingSessionsWidget } from '../../components/dashboard/DashboardComponents';
import { ROUTES } from '../../utils/constants';

import { bookingService } from '../../services/api/bookings';
import type { Booking } from '../../services/api/bookings';

export const ParentHome = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Booking[]>([]);

  const handleStartScreening = () => {
    const storedChildId = localStorage.getItem('latestChildId');
    if (storedChildId) {
      navigate(`${ROUTES.PARENT_SCREENING}?childId=${storedChildId}`);
    } else {
      navigate(ROUTES.PARENT_ADD_CHILD);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const upcoming = await bookingService.getUpcomingBookings();
        setSessions(upcoming);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Welcome Back! 👋</h1>
          <p className="text-lg opacity-90">
            Here's an overview of your autism screening journey with AutiCare
          </p>
        </div>

        {/* Stats */}
        <DashboardStats
          totalSessions={5}
          upcomingSessions={2}
          completedTests={1}
          activePatients={0}
        />

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card
            hoverable
            onClick={() => navigate(ROUTES.PARENT_ADD_CHILD)}
            className="cursor-pointer"
          >
            <div className="text-4xl mb-3">👶</div>
            <h3 className="font-bold text-lg mb-2">Add Child</h3>
            <p className="text-neutral-600 mb-4">
              Register your child before starting the screening journey.
            </p>
            <Button size="sm" fullWidth>
              Add Child
            </Button>
          </Card>

          <Card
            hoverable
            onClick={handleStartScreening}
            className="cursor-pointer"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-bold text-lg mb-2">Start Screening</h3>
            <p className="text-neutral-600 mb-4">
              Take the autism screening to get detailed insights
            </p>
            <Button size="sm" fullWidth>
              Start Screening
            </Button>
          </Card>

          <Card
            hoverable
            onClick={() => navigate(ROUTES.PARENT_BOOK_SPECIALIST)}
            className="cursor-pointer"
          >
            <div className="text-4xl mb-3">👨‍⚕️</div>
            <h3 className="font-bold text-lg mb-2">Book Specialist</h3>
            <p className="text-neutral-600 mb-4">
              Schedule a session with doctors and therapists
            </p>
            <Button size="sm" fullWidth>
              Book Now
            </Button>
          </Card>

          <Card
            hoverable
            onClick={() => navigate(ROUTES.PARENT_SCREENING_RESULTS)}
            className="cursor-pointer"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-lg mb-2">View Results</h3>
            <p className="text-neutral-600 mb-4">
              Check your screening results and recommendations
            </p>
            <Button size="sm" fullWidth>
              View Results
            </Button>
          </Card>
        </div>

        {/* Upcoming Sessions */}
        <UpcomingSessionsWidget sessions={sessions} />

        {/* Recent Activities */}
        <Card>
          <h3 className="text-xl font-bold text-neutral-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl">📝</div>
              <div>
                <p className="font-medium text-neutral-900">Screening Completed</p>
                <p className="text-sm text-neutral-500">3 days ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl">👨‍⚕️</div>
              <div>
                <p className="font-medium text-neutral-900">Session with Dr. Smith</p>
                <p className="text-sm text-neutral-500">1 week ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
