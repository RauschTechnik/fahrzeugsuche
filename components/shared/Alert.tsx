import { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/shared/Icon';

export enum AlertType {
  Info = 'info',
  Success = 'success',
  Danger = 'danger',
  Warning = 'warning',
  Neutral = 'neutral'
}

const AlertTypeIconMap = {
  [AlertType.Info]: 'circle-info',
  [AlertType.Success]: 'circle-check',
  [AlertType.Danger]: 'circle-cross',
  [AlertType.Warning]: 'triangle-exclamation',
  [AlertType.Neutral]: 'circle-info'
};

interface Props extends ComponentPropsWithoutRef<'div'> {
  text: string;
  type?: AlertType.Info | AlertType.Success | AlertType.Danger | AlertType.Warning | AlertType.Neutral;
  inline?: boolean;
  closeable?: boolean;
  onClose?: () => void;
}

export function Alert({ text, type = AlertType.Info, inline = false, closeable = false, className, onClose }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border p-4',
        inline
          ? 'gap-1.5 border-none p-0'
          : {
              'border-sky-300 text-sky-600': type === AlertType.Info,
              'border-emerald-300 text-emerald-600': type === AlertType.Success,
              'border-red-300 text-red-600': type === AlertType.Danger,
              'border-amber-300 text-amber-600': type === AlertType.Warning,
              'border-gray-300 text-gray-600': type === AlertType.Neutral
            },
        className
      )}>
      <Icon
        icon={AlertTypeIconMap[type]}
        className={cn({
          'text-sky-500': type === AlertType.Info,
          'text-emerald-500': type === AlertType.Success,
          'text-red-500': type === AlertType.Danger,
          'text-amber-500': type === AlertType.Warning,
          'text-black': type === AlertType.Neutral
        })}
      />

      <p className="min-w-0 break-words">{text}</p>

      {closeable && (
        <Button size="icon-sm" variant="ghost" onClick={onClose}>
          <Icon icon="cross" className="text-black/40" />
        </Button>
      )}
    </div>
  );
}
