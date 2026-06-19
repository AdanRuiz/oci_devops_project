import type { Person } from '../../types/work-item-ui.types';
import { PersonAvatar } from './person-avatar';

interface PersonStackProps {
  people: Person[];
}

export function PersonStack({ people }: PersonStackProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-3">
        {people.map((person) => (
          <PersonAvatar
            key={person.id}
            person={person}
            className="h-10 w-10 border-2 border-zinc-950 shadow-md"
          />
        ))}
      </div>
      
      <div>
        <p className="text-sm font-medium text-white">
          {people.length} collaborators
        </p>
        <p className="text-xs text-zinc-400">Cross-functional ownership</p>
      </div>
    </div>
  );
}