import { createElement as h, type ReactElement } from 'react';
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import type { CvSections } from './cv-score';

// Font standar PDF (Helvetica) supaya teksnya tertanam sebagai text layer asli tanpa unduh font.
const styles = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 48, fontFamily: 'Helvetica', fontSize: 10.5, lineHeight: 1.45, color: '#111111' },
  name: { fontFamily: 'Helvetica-Bold', fontSize: 18 },
  contact: { marginTop: 3, color: '#3d3d3d' },
  heading: { fontFamily: 'Helvetica-Bold', fontSize: 11.5, marginTop: 14, marginBottom: 4, paddingBottom: 2, borderBottomWidth: 0.75, borderBottomColor: '#111111' },
  entryTitle: { fontFamily: 'Helvetica-Bold' },
  entry: { marginBottom: 6 },
  bullet: { flexDirection: 'row', marginLeft: 6 },
  bulletMark: { width: 10 },
  bulletText: { flex: 1 },
});

export function periodText(start: string, end: string): string {
  const s = start.trim();
  const e = end.trim();
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

export function contactLine(sections: CvSections): string {
  return [sections.targetRole, sections.contact.city, sections.contact.email, sections.contact.phone]
    .map((v) => v.trim())
    .filter(Boolean)
    .join(' · ');
}

function cvDocument(sections: CvSections, title: string): ReactElement {
  const experience = sections.experience.filter((e) => e.role.trim() || e.company.trim());
  const education = sections.education.filter((e) => e.institution.trim());
  const skills = sections.skills.map((s) => s.trim()).filter(Boolean);

  const children: ReactElement[] = [
    h(Text, { key: 'name', style: styles.name }, (sections.contact.fullName || 'Nama belum diisi').toUpperCase()),
    h(Text, { key: 'contact', style: styles.contact }, contactLine(sections)),
  ];

  if (sections.summary.trim()) {
    children.push(h(Text, { key: 'h-sum', style: styles.heading }, 'Ringkasan'));
    children.push(h(Text, { key: 'sum' }, sections.summary.trim()));
  }

  if (experience.length) {
    children.push(h(Text, { key: 'h-exp', style: styles.heading }, 'Pengalaman'));
    experience.forEach((e, i) => {
      const period = periodText(e.startYear, e.endYear);
      children.push(
        h(View, { key: `exp-${i}`, style: styles.entry, wrap: false },
          h(Text, { style: styles.entryTitle }, [e.role, e.company].filter((v) => v.trim()).join(' — ') + (period ? ` (${period})` : '')),
          ...e.bullets.filter((b) => b.trim()).map((b, j) =>
            h(View, { key: j, style: styles.bullet }, h(Text, { style: styles.bulletMark }, '•'), h(Text, { style: styles.bulletText }, b.trim())),
          ),
        ),
      );
    });
  }

  if (skills.length) {
    children.push(h(Text, { key: 'h-skill', style: styles.heading }, 'Keahlian'));
    children.push(h(Text, { key: 'skill' }, skills.join(' · ')));
  }

  if (education.length) {
    children.push(h(Text, { key: 'h-edu', style: styles.heading }, 'Pendidikan'));
    education.forEach((e, i) => {
      const line = [e.institution, e.major].filter((v) => v.trim()).join(' — ') + (e.graduationYear.trim() ? ` (${e.graduationYear.trim()})` : '');
      children.push(h(Text, { key: `edu-${i}` }, line));
    });
  }

  return h(Document, { title, author: sections.contact.fullName, creator: 'RuangLoker', producer: 'RuangLoker' },
    h(Page, { size: 'A4', style: styles.page }, ...children),
  );
}

export async function renderCvPdf(sections: CvSections, title: string): Promise<Buffer> {
  return renderToBuffer(cvDocument(sections, title) as Parameters<typeof renderToBuffer>[0]);
}
