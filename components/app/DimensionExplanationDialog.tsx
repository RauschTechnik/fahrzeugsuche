import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/shared/Icon';
import { ComponentPropsWithoutRef } from 'react';

interface Props extends ComponentPropsWithoutRef<'div'> {
  title: string;
  description?: string;
  image: string;
}

export function DimensionExplanationDialog({ title, image, description, ...props }: Props) {
  const t = useTranslations('WheelchairTypesExplanationDialog');
  return (
    <div {...props}>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className={'align-middle'}
            icon={<Icon icon="circle-question" className="text-gray-400" />}
            variant="ghost"
            size="icon-sm"
          />
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {!!description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div>
            <Icon icon={image} className="size-auto" />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('done')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
