import { z } from 'zod';
import { toast } from 'sonner';
import { ComponentPropsWithoutRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { VehicleMatch } from '@/types/app';
import { sendVehicleMatchesMail } from '@/lib/actions/email-vehicle-matches.actions';

interface Props extends ComponentPropsWithoutRef<'div'> {
  matches: Array<VehicleMatch>;
}

export function EmailMatchesDialog({ matches, ...props }: Props) {
  const t = useTranslations();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    email: z.string().trim().nonempty(t('Validations.email.required')).email(t('Validations.email.invalid')),
    first_name: z.string().trim().nonempty(t('Validations.first-name.required')),
    last_name: z.string().trim().nonempty(t('Validations.last-name.required'))
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', first_name: '', last_name: '' }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    const isSuccess = await sendVehicleMatchesMail({
      to: values.email,
      firstName: values.first_name,
      lastName: values.last_name,
      matches
    });

    setIsSubmitting(false);
    setIsDialogOpen(false);
    form.reset();

    if (isSuccess) {
      toast.success(t('EmailMatchesDialog.submitted-successfully'));
    } else {
      toast.error(t('EmailMatchesDialog.something-went-wrong'));
    }
  };

  return (
    <div {...props}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mt-8 w-full" size="lg" variant="outline">
            {t('EmailMatchesDialog.trigger')}
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('EmailMatchesDialog.title')}</DialogTitle>
            <DialogDescription>{t('EmailMatchesDialog.description')}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form name="form" className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-2">
                        <Label>{t('EmailMatchesDialog.email')}</Label>
                        <Input autoComplete="email" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-2">
                        <Label>{t('EmailMatchesDialog.first-name')}</Label>
                        <Input {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-2">
                        <Label>{t('EmailMatchesDialog.last-name')}</Label>
                        <Input {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('EmailMatchesDialog.cancel')}</Button>
            </DialogClose>

            <Button onClick={form.handleSubmit(onSubmit)} type="button" loading={isSubmitting}>
              {t('EmailMatchesDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
