import { createElement as h } from 'react';
import { Document, Page, StyleSheet, Text, renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { paddingVertical: 56, paddingHorizontal: 64, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.55, color: '#111111' },
  line: { minHeight: 11 },
});

export async function renderLetterPdf(body: string, title: string): Promise<Buffer> {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const doc = h(
    Document,
    { title, author: 'RuangLoker', creator: 'RuangLoker' },
    h(Page, { size: 'A4', style: styles.page }, ...lines.map((l, i) => h(Text, { key: i, style: styles.line }, l || ' '))),
  );
  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
}
