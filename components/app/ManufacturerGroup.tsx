import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VehicleMatch } from '@/types/app';
import { VehicleMatchCard } from '@/components/app/VehicleMatchCard';

interface Props {
  manufacturerName: string;
  matches: Array<VehicleMatch>;
}

export function ManufacturerGroup({ manufacturerName, matches }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="border-b border-gray-200">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 py-5 text-left">
        <p className="text-lg font-bold text-key-500">
          {manufacturerName} <span className="text-gray-500">({matches.length})</span>
        </p>

        <ChevronDown className={cn('size-5 flex-shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <ul className="pb-3">
          {matches.map((match) => (
            <VehicleMatchCard key={match.uid} match={match} />
          ))}
        </ul>
      )}
    </li>
  );
}
