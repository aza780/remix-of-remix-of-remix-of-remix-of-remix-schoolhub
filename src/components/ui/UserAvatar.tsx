import { getInitials } from '@/lib/getInitials';
import { getAvatarColor } from '@/lib/getAvatarColor';

interface UserAvatarProps {
  email: string;
  size?: 'sm' | 'md';
}

export function UserAvatar({ email, size = 'sm' }: UserAvatarProps) {
  const { bg, text } = getAvatarColor(email);
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';

  return (
    <div className={`${sizeClass} ${bg} ${text} flex items-center justify-center rounded-full font-bold`}>
      {getInitials(email)}
    </div>
  );
}
