export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

export const truncateText = (text: string, length: number): string => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

export const capitalizeFirstLetter = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-');
};

export const toTitleCase = (text: string): string => {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const highlightText = (text: string, query: string): string => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const getFormattedImageUrl = (image?: string): string => {
  if (!image) return '';
  if (
    image.startsWith('http://') ||
    image.startsWith('https://') ||
    image.startsWith('data:') ||
    image.startsWith('blob:')
  ) {
    return image;
  }
  return `https://auticare-production-828c.up.railway.app${image.startsWith('/') ? image : `/${image}`}`;
};

