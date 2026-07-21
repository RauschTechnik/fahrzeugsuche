'use server';

import { render } from '@react-email/render';
import { getTranslations } from 'next-intl/server';
import VehicleMatchesEmail from '@/components/emails/VehicleMatchesEmail';
import { VehicleMatch } from '@/types/app';
import { sendEmail } from '@/lib/mailing';

export async function sendVehicleMatchesMail(opts: {
  to: string;
  firstName: string;
  lastName: string;
  matches: Array<VehicleMatch>;
}) {
  const t = await getTranslations('Emails.VehicleMatches');
  const html = await render(
    <VehicleMatchesEmail firstName={opts.firstName} lastName={opts.lastName} matches={opts.matches} />
  );

  let isSuccess = true;
  try {
    await sendEmail({
      to: opts.to,
      copyTo: process.env.VEHICLE_MATCHES_EMAIL_COPY_TO!,
      subject: t('subject'),
      html
    });
  } catch {
    isSuccess = false;
  }
  return isSuccess;
}
