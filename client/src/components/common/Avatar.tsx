import React from 'react';
import { cn, getInitials, generateAvatarColor } from '../../utils/helpers';

interface AvatarProps {
  src?: string;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  firstName = '',
  lastName = '',
  size = 'md',
  className
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const initials = getInitials(firstName, lastName);
  const bgColor = generateAvatarColor(firstName + lastName);

  if (src) {
    return (
      <img
        src={src}
        alt={alt || `${firstName} ${lastName}`}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium',
        bgColor,
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
};

export default Avatar;