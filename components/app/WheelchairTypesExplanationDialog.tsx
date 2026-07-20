import Image from 'next/image';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { WheelchairType } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/shared/Icon';
import Scooter from '@/assets/images/wheelchairs/scooter.png';
import Regular from '@/assets/images/wheelchairs/regular.png';
import Compressible from '@/assets/images/wheelchairs/compressible.png';

export function WheelchairTypesExplanationDialog() {
  const t = useTranslations('WheelchairTypesExplanationDialog');

  const wheelchairTypes = [
    {
      id: WheelchairType.Regular,
      image: Regular,
      name: t('regular.name'),
      description: t('regular.description')
    },
    {
      id: WheelchairType.Compressible,
      image: Compressible,
      name: t('compressible.name'),
      description: t('compressible.description')
    },
    {
      id: WheelchairType.Scooter,
      image: Scooter,
      name: t('scooter.name'),
      description: t('scooter.description')
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button icon={<Icon icon="circle-question" className="text-gray-400" />} variant="ghost" size="icon-sm" />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <ul className="space-y-5">
          {wheelchairTypes.map((type) => (
            <li key={type.id} className="flex items-start gap-4">
              <Image src={type.image} width={80} height={80} alt={type.name} />

              <div>
                <h5 className="mb-1 font-semibold">{type.name}</h5>

                <p>{type.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('done')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
