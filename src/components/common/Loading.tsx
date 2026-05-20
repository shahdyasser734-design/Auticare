export const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
  </div>
);

export const LoadingSkeleton = ({ count = 1 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="h-12 bg-neutral-200 rounded-lg animate-shimmer"
      />
    ))}
  </div>
);

import { GlobalLogo } from './GlobalLogo';

export const LoadingPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-soft-bg">
    <GlobalLogo animated interactive />
    <p className="mt-8 text-navy-600 font-medium tracking-wider">Loading AutiCare...</p>
  </div>
);
