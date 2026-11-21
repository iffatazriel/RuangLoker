import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appOrigin, resetPasswordEmail, sendMail } from './mail.ts';

test('sendMail tanpa RESEND_API_KEY hanya mencetak ke log', async () => {
  delete process.env.RESEND_API_KEY;
  const original = console.info;
  const logged: string[] = [];
  console.info = (msg: string) => logged.push(msg);
  try {
    const r = await sendMail({ to: 'a@contoh.id', subject: 'Uji', text: 'isi' });
    assert.deepEqual(r, { sent: false, reason: 'not-configured' });
    assert.match(logged[0], /to=a@contoh.id subject=Uji/);
  } finally {
    console.info = original;
  }
});

test('appOrigin memakai APP_URL, dan tidak memercayai Host di produksi', () => {
  delete process.env.APP_URL;
  const req = new URL('http://evil.example/lupa-sandi');
  assert.equal(appOrigin(req, false), 'http://evil.example');
  assert.equal(appOrigin(req, true), 'https://ruangloker.id');
  process.env.APP_URL = 'https://app.ruangloker.id/';
  assert.equal(appOrigin(req, true), 'https://app.ruangloker.id');
  delete process.env.APP_URL;
});

test('resetPasswordEmail memuat tautan dan masa berlaku', () => {
  const m = resetPasswordEmail('Rina', 'https://ruangloker.id/atur-sandi?token=abc', 60);
  assert.match(m.text, /Halo Rina/);
  assert.match(m.text, /atur-sandi\?token=abc/);
  assert.match(m.text, /60 menit/);
});
