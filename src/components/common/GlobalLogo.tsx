import { useState } from 'react';
import clsx from 'clsx';
import { AutismLogo } from './AutismLogo';

export const GlobalLogo = ({
  className,
  animated = false,
  interactive = false,
  onComplete,
}: {
  className?: string;
  animated?: boolean;
  interactive?: boolean;
  onComplete?: () => void;
}) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (interactive && !clicked) {
      setClicked(true);
      if (onComplete) {
        setTimeout(onComplete, 800);
      }
    }
  };

  return (
    <div
      className={clsx(
        'relative flex items-center justify-center overflow-hidden rounded-full cursor-pointer transition-transform duration-500',
        clicked && 'scale-0 opacity-0',
        className
      )}
      onClick={handleClick}
    >
      <AutismLogo size="xl" animated={animated && !clicked} glow={true} />
    </div>
  );
};
