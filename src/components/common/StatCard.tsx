interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export const StatCard = ({ label, value, icon, trend, trendValue }: StatCardProps) => {
  const trendColors = {
    up: 'text-success-600',
    down: 'text-danger-600',
    neutral: 'text-neutral-600',
  };

  return (
    <div className="standard-card p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-neutral-600 text-sm font-medium">{label}</p>
        {icon && <div className="text-primary-600 text-2xl">{icon}</div>}
      </div>
      <p className="text-3xl font-bold text-neutral-900 mb-2">{value}</p>
      {trend && trendValue && (
        <p className={`text-sm font-medium ${trendColors[trend]}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </p>
      )}
    </div>
  );
};
