import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  icon: string;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ icon, className, ...props }) => {
  const ImportedIcon = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require(`@/assets/icons/${icon}.svg`).default;
    } catch (error) {
      console.error(`Icon not found: ${icon}`, error);
      return null;
    }
  }, [icon]);

  if (!ImportedIcon) return null;

  return <ImportedIcon className={cn('inline-block size-6', className && className)} {...props} />;
};

export { Icon };
