import { Html, Head, Preview, Body, Container, Section, Text } from '@react-email/components';
import * as React from 'react';
import { getTranslations } from 'next-intl/server';
import { translateProductLabel, VehicleMatch } from '@/types/app';

type Props = {
  firstName: string;
  lastName: string;
  matches: Array<VehicleMatch>;
};

export default async function VehicleMatchesEmail({ firstName, lastName, matches }: Props) {
  const t = await getTranslations('VehicleMatches');
  const tem = await getTranslations('Emails.VehicleMatches');
  const tProductLabels = await getTranslations('ProductLabels');

  const gray = '#6b7280';
  const orange = '#eb7a23';
  const emerald = '#10b981';

  const groupedByManufacturer = new Map<string, Array<VehicleMatch>>();
  for (const match of matches) {
    const name = match.carModel.manufacturer.name;
    const existing = groupedByManufacturer.get(name);
    if (existing) {
      existing.push(match);
    } else {
      groupedByManufacturer.set(name, [match]);
    }
  }
  const manufacturers = Array.from(groupedByManufacturer.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Html>
      <Head />
      <Preview>{tem('greeting-full', { firstName, lastName })}</Preview>

      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 640, margin: '0 auto', backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <Section style={{ borderBottom: '1px solid #e5e7eb', padding: 24, lineHeight: 1.5 }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: gray, margin: '0 0 12px' }}>
              {tem('greeting-first-part', { firstName, lastName })}
            </Text>
            <Text style={{ fontSize: 15, color: gray, margin: 0 }}>{tem('greeting-second-part')}</Text>
          </Section>

          {manufacturers.map(([manufacturerName, manufacturerMatches]) => (
            <Section key={manufacturerName} style={{ borderBottom: '1px solid #e5e7eb', padding: '24px' }}>
              <Text style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#111827' }}>
                {manufacturerName}
              </Text>

              {manufacturerMatches.map((match) => (
                <Section key={match.uid} style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{match.carModel.name}</Text>
                  <Text style={{ fontSize: 14, color: gray, margin: '2px 0 12px' }}>
                    {match.carModel.yearOfProductionSince}
                    {match.carModel.yearOfProductionUntil
                      ? ` - ${match.carModel.yearOfProductionUntil}`
                      : ` - ${t('model-today')}`}
                  </Text>

                  {match.carModel.hybridOrElectricDisclaimer && (
                    <table
                      role="presentation"
                      width="100%"
                      cellPadding={0}
                      cellSpacing={0}
                      style={{ border: '1px solid #0ea5e9', borderRadius: 8, fontSize: 14, marginBottom: 12 }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 12px', color: '#0ea5e9' }}>{t('loading-capacity-disclaimer')}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {match.loadingOptions.map((option) => (
                    <table
                      key={option.label}
                      role="presentation"
                      width="100%"
                      cellPadding={0}
                      cellSpacing={0}
                      style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 8 }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '10px 12px' }}>
                            <Text style={{ fontSize: 15, fontWeight: 700, margin: 0, color: orange }}>
                              {translateProductLabel(tProductLabels, option.label)}
                            </Text>
                            <Text style={{ fontSize: 14, margin: '6px 0 0' }}>
                              <span style={{ color: gray }}>{`${t('remaining-seats')}: `}</span>
                              <span>{option.remainingSeats.trim() ? option.remainingSeats : t('not-applicable')}</span>
                            </Text>
                            <Text style={{ fontSize: 14, margin: '4px 0 0' }}>
                              <span style={{ color: gray, marginRight: 6 }}>{`${t('compatibility')}: `}</span>
                              {option.showCheckWithSupportWarning ? (
                                <>
                                  <span style={{ color: '#eab308', marginRight: 6 }}>{'⚠'}</span>
                                  <span>{t('check-with-support')}</span>
                                </>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: 18,
                                    height: 18,
                                    lineHeight: '18px',
                                    textAlign: 'center',
                                    backgroundColor: emerald,
                                    color: '#ffffff',
                                    borderRadius: '50%',
                                    fontSize: 12
                                  }}>
                                  {'✓'}
                                </span>
                              )}
                            </Text>
                            {!!option.comment && (
                              <Text style={{ fontSize: 13, margin: '6px 0 0', color: '#0ea5e9' }}>
                                {option.comment}
                              </Text>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ))}
                </Section>
              ))}
            </Section>
          ))}
        </Container>
      </Body>
    </Html>
  );
}
