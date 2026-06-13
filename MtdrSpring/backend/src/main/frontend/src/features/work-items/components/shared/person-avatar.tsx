import type { Person } from '../../types/work-item-ui.types';
import { getPersonInitials, joinClasses } from '../../lib/work-item-ui';

interface PersonAvatarProps {
  person: Person;
  className?: string;
}

export function PersonAvatar({ person, className }: PersonAvatarProps) {
  return (
    <div
      className={joinClasses(
        'flex items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-white',
        className,
      )}
      title={person.name}
      aria-label={person.name}
    >
      <span className="text-xs font-semibold tracking-wide">
        {getPersonInitials(person)}
      </span>
    </div>
  );
}