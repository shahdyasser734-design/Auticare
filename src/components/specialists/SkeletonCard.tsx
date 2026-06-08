// UI-only skeleton; relies on the project's JSX runtime (no React symbol needed)

export const SkeletonCard = () => {
  return (
    <div className="animate-pulse standard-card p-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-200" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-3/5" />
          <div className="mt-2 h-3 bg-slate-200 rounded w-2/5" />
        </div>
      </div>

      <div className="mt-4 h-9 bg-slate-200 rounded" />
    </div>
  );
};

export default SkeletonCard;
