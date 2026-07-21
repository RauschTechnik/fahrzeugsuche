'use server';

import SparkPost from 'sparkpost';

const sparkpostClient = new SparkPost(process.env.SPARKPOST_API_KEY!, { origin: 'https://api.eu.sparkpost.com:443' });

export interface EmailPayload {
  to: string;
  copyTo?: string;
  subject: string;
  html: string;
}

export const sendEmail = async (payload: EmailPayload) => {
  const mainTo = payload.to;
  const recipients: SparkPost.Recipient[] = [{ address: { email: mainTo } }];

  if (payload.copyTo) {
    recipients.push({
      address: {
        email: payload.copyTo,
        header_to: mainTo
      }
    });
  }

  const { results } = await sparkpostClient.transmissions.send({
    options: { sandbox: false },
    content: {
      from: process.env.SPARKPOST_FROM!,
      subject: payload.subject,
      html: payload.html
    },
    recipients: recipients
  });

  return results.id;
};
