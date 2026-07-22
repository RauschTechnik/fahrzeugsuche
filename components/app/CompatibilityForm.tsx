import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { ComponentPropsWithoutRef, useEffect, useMemo, useState } from 'react';
import { CompatibilityParams, LoadingSpace, WheelchairType } from '@/types/app';
import styles from '@/assets/styles/app.module.css';
import { Icon } from '@/components/shared/Icon';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { WheelchairTypesExplanationDialog } from '@/components/app/WheelchairTypesExplanationDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DimensionExplanationDialog } from '@/components/app/DimensionExplanationDialog';

interface Props extends ComponentPropsWithoutRef<'form'> {
  isCheckDisabled: boolean;
  onCheckCompatibility: (values: CompatibilityParams) => void;
}

export function CompatibilityForm({ isCheckDisabled, onCheckCompatibility, ...props }: Props) {
  const t = useTranslations();

  const wheelchairTypes = [
    { id: WheelchairType.Regular, label: t('WheelchairType.regular') },
    { id: WheelchairType.Compressible, label: t('WheelchairType.compressible') },
    { id: WheelchairType.Scooter, label: t('WheelchairType.scooter') }
  ];

  const loadingSpaces = [
    { id: LoadingSpace.Trunk, label: t('LoadingSpace.trunk') },
    { id: LoadingSpace.Side, label: t('LoadingSpace.side') }
  ];

  const [activeWheelchairType, setActiveWheelchairType] = useState<WheelchairType>(WheelchairType.Regular);

  const [activeLoadingSpace, setActiveLoadingSpace] = useState<LoadingSpace>(LoadingSpace.Trunk);

  const fieldsVisibilityStates = useMemo(() => {
    return {
      isRegular: activeWheelchairType === WheelchairType.Regular,
      isCompressible: activeWheelchairType === WheelchairType.Compressible,
      isScooter: activeWheelchairType === WheelchairType.Scooter
    };
  }, [activeWheelchairType]);

  // Compressible wheelchairs and scooters are only ever loaded in the trunk -
  // lock the choice to that as soon as one of those types is selected.
  const isLoadingSpaceLocked = fieldsVisibilityStates.isCompressible || fieldsVisibilityStates.isScooter;

  useEffect(() => {
    if (isLoadingSpaceLocked) {
      setActiveLoadingSpace(LoadingSpace.Trunk);
    }
  }, [isLoadingSpaceLocked]);

  const fieldsWidthClassName = useMemo(() => {
    return cn(fieldsVisibilityStates.isRegular ? 'md:w-1/4' : 'md:w-1/3');
  }, [fieldsVisibilityStates]);

  const formSchema = z.object({
    length: fieldsVisibilityStates.isCompressible
      ? z.any()
      : z.coerce
          .number()
          .int(t('Validations.length.integer'))
          .min(20, t('Validations.length.min', { value: 20 }))
          .max(200, t('Validations.length.max', { value: 200 })),
    width: fieldsVisibilityStates.isScooter
      ? z.coerce
          .number()
          .int(t('Validations.width.integer'))
          .min(20, t('Validations.width.min', { value: 20 }))
          .max(200, t('Validations.width.max', { value: 200 }))
      : z.any(),
    width_unfolded: fieldsVisibilityStates.isRegular
      ? z.coerce
          .number()
          .int(t('Validations.width-unfolded.integer'))
          .min(20, t('Validations.width-unfolded.min', { value: 20 }))
          .max(200, t('Validations.width-unfolded.max', { value: 200 }))
      : z.any(),
    width_folded: fieldsVisibilityStates.isRegular
      ? z.coerce
          .number()
          .int(t('Validations.width-folded.integer'))
          .min(20, t('Validations.width-folded.min', { value: 20 }))
          .max(200, t('Validations.width-folded.max', { value: 200 }))
      : z.any(),
    height: fieldsVisibilityStates.isCompressible
      ? z.any()
      : z.coerce
          .number()
          .int(t('Validations.height.integer'))
          .min(20, t('Validations.height.min', { value: 20 }))
          .max(200, t('Validations.height.max', { value: 200 }))
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      length: '',
      width: '',
      width_unfolded: '',
      width_folded: '',
      height: ''
    }
  });

  const onHandleSubmit = async (values: z.infer<typeof formSchema>) => {
    onCheckCompatibility({
      loading_space: activeLoadingSpace,
      wheelchair_type: activeWheelchairType,
      length: values.length,
      width: fieldsVisibilityStates.isCompressible || fieldsVisibilityStates.isScooter ? values.width : undefined,
      width_unfolded: fieldsVisibilityStates.isRegular ? values.width_unfolded : undefined,
      width_folded: fieldsVisibilityStates.isRegular ? values.width_folded : undefined,
      height: values.height,
      // Scooters are always stored as heavy in the vehicle data - there is no
      // lighter category to distinguish, so this is never user-chosen.
      is_heavy_wc: fieldsVisibilityStates.isScooter
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onHandleSubmit)} className={styles.app__form} {...props}>
        <div className={styles.app__form_wheelchair}>
          <div className={styles.app__form_header}>
            <div className={styles.app__form_header_inner}>
              <Icon icon="wheelchair" className="size-8 text-key-500" />

              <h2 className={styles.app__form_title}>{t('CompatibilityForm.title-wheelchair')}</h2>
            </div>
          </div>

          <div className={styles.app__form_body}>
            <div className={'flex flex-col gap-2 md:w-1/2 md:gap-1'}>
              <Label className="inline-flex items-center gap-1 self-start">
                {t('CompatibilityForm.type')}

                <WheelchairTypesExplanationDialog />
              </Label>

              <Tabs
                value={activeWheelchairType}
                onValueChange={(type) => setActiveWheelchairType(type as WheelchairType)}>
                <TabsList className={styles.app__form_tablist}>
                  {wheelchairTypes.map((type) => (
                    <TabsTrigger key={type.id} value={type.id} className={styles.app__form_tabtrigger}>
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {!fieldsVisibilityStates.isCompressible && (
            <div className={styles.app__form_body}>
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem className={fieldsWidthClassName}>
                    <FormControl>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className={'flex flex-col gap-2 md:gap-1'}>
                              <div className="inline-flex items-center gap-1 self-start">
                                <Label htmlFor="length">{t('CompatibilityForm.length')}</Label>
                                <DimensionExplanationDialog
                                  title={t('CompatibilityForm.length')}
                                  description={
                                    fieldsVisibilityStates.isScooter
                                      ? undefined
                                      : t('CompatibilityForm.length-description')
                                  }
                                  image={'wheelchair_length'}
                                />
                              </div>
                              <Input {...field} type="number" id="length" />

                              {fieldsVisibilityStates.isScooter && (
                                <p className="inline-flex items-center gap-1.5 text-sm text-amber-600">
                                  <Icon icon="circle-info" className="size-4 flex-shrink-0" />
                                  {t('CompatibilityForm.scooter-length-hint')}
                                </p>
                              )}
                            </div>
                          </TooltipTrigger>

                          <TooltipContent className={'hidden md:block'}>
                            <div className="p-5">
                              <Icon icon="wheelchair_length" className="size-32" />
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(fieldsVisibilityStates.isCompressible || fieldsVisibilityStates.isScooter) && (
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem className={fieldsWidthClassName}>
                      <FormControl>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div className={styles.app__form_field}>
                                <div className="inline-flex items-center gap-1 self-start">
                                  <Label htmlFor="width">{t('CompatibilityForm.width')}</Label>
                                  <DimensionExplanationDialog
                                    className={fieldsVisibilityStates.isScooter ? '' : 'md:hidden'}
                                    title={t('CompatibilityForm.width')}
                                    image={'wheelchair_width'}
                                  />
                                </div>
                                <Input {...field} type="number" id="width" />

                                {fieldsVisibilityStates.isScooter && (
                                  <p className="inline-flex items-center gap-1.5 text-sm text-amber-600">
                                    <Icon icon="circle-info" className="size-4 flex-shrink-0" />
                                    {t('CompatibilityForm.scooter-width-hint')}
                                  </p>
                                )}
                              </div>
                            </TooltipTrigger>

                            <TooltipContent className={'hidden md:block'}>
                              <div className="p-5">
                                <Icon icon="wheelchair_width" className="size-32" />
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {fieldsVisibilityStates.isRegular && (
                <FormField
                  control={form.control}
                  name="width_unfolded"
                  render={({ field }) => (
                    <FormItem className={fieldsWidthClassName}>
                      <FormControl>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div className={styles.app__form_field}>
                                <div className="inline-flex items-center gap-1 self-start">
                                  <Label htmlFor="width_unfolded">{t('CompatibilityForm.width-unfolded')}</Label>
                                  <DimensionExplanationDialog
                                    title={t('CompatibilityForm.width-unfolded')}
                                    description={t('CompatibilityForm.width-unfolded-description')}
                                    image={'wheelchair_width'}
                                  />
                                </div>
                                <Input {...field} type="number" id="width_unfolded" />
                              </div>
                            </TooltipTrigger>

                            <TooltipContent className={'hidden md:block'}>
                              <div className="p-5">
                                <Icon icon="wheelchair_width" className="size-32" />
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {fieldsVisibilityStates.isRegular && (
                <FormField
                  control={form.control}
                  name="width_folded"
                  render={({ field }) => (
                    <FormItem className={fieldsWidthClassName}>
                      <FormControl>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div className={styles.app__form_field}>
                                <div className="inline-flex items-center gap-1 self-start">
                                  <Label htmlFor="width_folded">{t('CompatibilityForm.width-folded')}</Label>
                                  <DimensionExplanationDialog
                                    title={t('CompatibilityForm.width-folded')}
                                    description={t('CompatibilityForm.width-folded-description')}
                                    image={'wheelchair_width_folded'}
                                  />
                                </div>
                                <Input {...field} type="number" id="width_folded" />
                              </div>
                            </TooltipTrigger>

                            <TooltipContent className={'hidden md:block'}>
                              <div className="p-5">
                                <Icon icon="wheelchair_width_folded" className="size-32" />
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem className={fieldsWidthClassName}>
                    <FormControl>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className={styles.app__form_field}>
                              <div className="inline-flex items-center gap-1 self-start">
                                <Label htmlFor="height">{t('CompatibilityForm.height')}</Label>
                                <DimensionExplanationDialog
                                  className={fieldsVisibilityStates.isScooter ? '' : 'md:hidden'}
                                  title={t('CompatibilityForm.height')}
                                  image={'wheelchair_height'}
                                />
                              </div>
                              <Input {...field} type="number" id="height" />

                              {fieldsVisibilityStates.isScooter && (
                                <p className="inline-flex items-center gap-1.5 text-sm text-amber-600">
                                  <Icon icon="circle-info" className="size-4 flex-shrink-0" />
                                  {t('CompatibilityForm.scooter-height-hint')}
                                </p>
                              )}
                            </div>
                          </TooltipTrigger>

                          <TooltipContent className={'hidden md:block'}>
                            <div className="p-5">
                              <Icon icon="wheelchair_height" className="size-32" />
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className={styles.app__form_vehicle}>
          <div className={styles.app__form_header}>
            <div className={styles.app__form_header_inner}>
              <Icon icon="vehicle" className="size-8 text-key-500" />

              <h2 className={styles.app__form_title}>{t('CompatibilityForm.title-loading-space')}</h2>
            </div>
          </div>

          <div className={styles.app__form_body}>
            <div className="flex w-full flex-col gap-2 md:gap-1">
              <Tabs value={activeLoadingSpace} onValueChange={(value) => setActiveLoadingSpace(value as LoadingSpace)}>
                <TabsList className={styles.app__form_tablist}>
                  {loadingSpaces.map((space) => (
                    <TabsTrigger
                      key={space.id}
                      value={space.id}
                      disabled={isLoadingSpaceLocked && space.id !== LoadingSpace.Trunk}
                      className={styles.app__form_tabtrigger}>
                      {space.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {isLoadingSpaceLocked && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-amber-600">
                  <Icon icon="circle-info" className="size-4 flex-shrink-0" />
                  {t(
                    fieldsVisibilityStates.isCompressible
                      ? 'CompatibilityForm.loading-space-locked-hint-compressible'
                      : 'CompatibilityForm.loading-space-locked-hint'
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.app__form_footer}>
          <Button className="w-full" size="lg" type="submit" disabled={isCheckDisabled}>
            {t('CompatibilityForm.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
