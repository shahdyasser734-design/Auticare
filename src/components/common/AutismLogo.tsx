import { useTheme } from '../../context/useTheme';

interface CubeProps {
  cx: number;
  cy: number;
  fillTop: string;
  fillLeft: string;
  fillRight: string;
}

const Cube = ({ cx, cy, fillTop, fillLeft, fillRight }: CubeProps) => (
  <g transform={`translate(${cx}, ${cy})`}>
    <path d="M 0 -22 L 19.05 -11 L 0 0 L -19.05 -11 Z" fill={fillTop} stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" className="transition-all duration-300 hover:opacity-90" />
    <path d="M -19.05 -11 L 0 0 L 0 22 L -19.05 11 Z" fill={fillLeft} stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" className="transition-all duration-300 hover:opacity-90" />
    <path d="M 19.05 -11 L 0 0 L 0 22 L 19.05 11 Z" fill={fillRight} stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" className="transition-all duration-300 hover:opacity-90" />
  </g>
);

interface AutismLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  glow?: boolean;
  className?: string;
}

export const AutismLogo = ({ size = 'md', animated = true, glow = true, className = '' }: AutismLogoProps) => {
  const { isDark } = useTheme();
  
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const SVGContent = (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className={`w-full h-full object-contain ${animated ? 'animate-[spin_20s_linear_infinite]' : ''} ${className}`}
      style={{
        filter: glow ? `drop-shadow(0 4px 12px ${isDark ? 'rgba(96,165,250,0.3)' : 'rgba(59,130,246,0.3)'})` : 'none',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(50, 48)">
        {/* Top Cube (Blue) */}
        <Cube cx={0} cy={-24} fillTop="#60A5FA" fillLeft="#3B82F6" fillRight="#2563EB" />
        {/* Left Cube (Teal) */}
        <Cube cx={-20} cy={-12.5} fillTop="#34D399" fillLeft="#10B981" fillRight="#059669" />
        {/* Right Cube (Purple) */}
        <Cube cx={20} cy={-12.5} fillTop="#A78BFA" fillLeft="#8B5CF6" fillRight="#7C3AED" />
        {/* Bottom Cube (Orange/Yellow) */}
        <Cube cx={0} cy={10.5} fillTop="#FBBF24" fillLeft="#F59E0B" fillRight="#D97706" />
      </g>
    </svg>
  );

  return (
    <div className={`flex items-center justify-center flex-shrink-0 ${sizes[size]}`}>
      {SVGContent}
    </div>
  );
};
