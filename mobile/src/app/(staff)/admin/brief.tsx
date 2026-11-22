import { Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Button, ErrorNotice, PageIntro, Screen, colors, styles } from '../../../components/ui';
import { money, type Brief } from '../../../features/admin/data';

export default function WeeklyBrief() {
  const mutation = useMutation({
    mutationFn: () => api<Brief>('/ai/weekly-brief', { method: 'POST', body: {} }),
  });
  const brief = mutation.data;
  return (
    <Screen footer={!brief ? (
      <Button title={mutation.isPending ? 'Preparing brief…' : 'Prepare weekly brief'} disabled={mutation.isPending} onPress={() => mutation.mutate()} />
    ) : undefined}>
      <PageIntro title="Weekly brief" description="A summary based on aggregate orders and stock." />
      <ErrorNotice error={mutation.error} />
      {brief ? (
        <>
          <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: colors.accent }]}>
            <Text style={styles.chip}>{brief.provider === 'gemini' ? 'AI assisted' : 'Template summary'}{brief.cached ? ' · Saved' : ''}</Text>
            <Text style={[styles.heading, { color: colors.ink }]}>{brief.headline}</Text>
            <Text style={[styles.caption, { color: colors.muted }]}>Week beginning {brief.week}</Text>
          </View>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>Highlights</Text>
            {brief.bullets.map((point, index) => <Text key={index} style={styles.sub}>• {point}</Text>)}
          </View>
          {!!brief.risks.length && <View style={[styles.card, { backgroundColor: colors.clay }]}>
            <Text accessibilityRole="header" style={styles.title}>Items to review</Text>
            {brief.risks.map((risk, index) => <Text key={index} style={styles.sub}>• {risk}</Text>)}
          </View>}
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>Source figures</Text>
            <Text style={styles.amount}>{money(brief.source.revenuePaise)}</Text>
            <Text style={styles.caption}>{brief.source.orderCount} orders · {brief.source.units} units</Text>
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.title}>Order and stock summary</Text>
          <Text style={styles.sub}>See this week’s highlights, items to review, and the source figures behind the brief.</Text>
        </View>
      )}
    </Screen>
  );
}
