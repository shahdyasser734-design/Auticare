import { useAuth } from '../../context/useAuth';

export const ChildSelector = () => {
  const { user, parentChildren, activeChildId, setActiveChildId } = useAuth();

  // Only render for parents who have children
  if (user?.role !== 'parent' || parentChildren.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="child-selector" className="text-xs font-semibold text-slate-500 hidden sm:block">
        Viewing:
      </label>
      <select
        id="child-selector"
        value={activeChildId || ''}
        onChange={(e) => setActiveChildId(e.target.value)}
        className="text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-0 rounded-lg py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none truncate max-w-[150px] sm:max-w-[200px]"
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
          backgroundSize: '14px'
        }}
      >
        {parentChildren.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name}
          </option>
        ))}
      </select>
    </div>
  );
};
