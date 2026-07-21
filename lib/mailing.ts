'use server';

import SparkPost from 'sparkpost';

// Constructed lazily (rather than at module scope) so a missing API key
// surfaces as a normal rejection the caller's try/catch can handle, instead
// of crashing the whole module - and therefore every action that imports it -
// at load time.
let sparkpostClient: SparkPost | null = null;
const getSparkpostClient = () => {
  if (!sparkpostClient) {
    sparkpostClient = new SparkPost(process.env.SPARKPOST_API_KEY!, { origin: 'https://api.eu.sparkpost.com:443' });
  }
  return sparkpostClient;
};

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

  const { results } = await getSparkpostClient().transmissions.send({
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
