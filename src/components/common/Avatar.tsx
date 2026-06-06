import { getInitials } from '../../utils/stringUtils';

interface AvatarProps {
  name?: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar = ({ name = 'User', image, size = 'md' }: AvatarProps) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  if (image) {
    const formatted = image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')
      ? image
      : `https://auticare-production-828c.up.railway.app${image.startsWith('/') ? image : `/${image}`}`;
    return (
      <img
        src={formatted}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 text-white font-bold flex items-center justify-center`}
    >
      {getInitials(name)}
    </div>
  );
};
