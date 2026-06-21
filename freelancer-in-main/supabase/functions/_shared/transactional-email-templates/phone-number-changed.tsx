/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Heading, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles, brand } from './_brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  siteName?: string
  siteUrl?: string
  fullName?: string
  oldPhone?: string
  newPhone?: string
  changedAt?: string
  supportUrl?: string
}

const SITE = 'Freelancer-in'

const Email = ({
  siteName = SITE,
  siteUrl,
  fullName,
  oldPhone,
  newPhone,
  changedAt,
  supportUrl,
}: Props) => (
  <Shell
    preview={`Your ${siteName} phone number was changed`}
    siteName={siteName}
    siteUrl={siteUrl}
    accent={brand.accent}
  >
    <Text style={styles.badge(brand.accent)}>✓ Phone updated</Text>
    <Heading style={styles.h1}>Your phone number was changed</Heading>
    <Text style={styles.text}>
      Hi {fullName || 'there'}, the phone number linked to your{' '}
      <strong>{siteName}</strong> account has been updated.
    </Text>
    <div style={styles.infoBox}>
      {oldPhone && (
        <Text style={styles.infoRow}>
          <strong>Previous:</strong> {oldPhone}
        </Text>
      )}
      {newPhone && (
        <Text style={styles.infoRow}>
          <strong>New:</strong> {newPhone}
        </Text>
      )}
      {changedAt && (
        <Text style={styles.infoRow}>
          <strong>When:</strong> {changedAt}
        </Text>
      )}
    </div>
    <Text style={styles.alert}>
      ⚠️ If you didn't make this change, contact support
      {supportUrl ? <> at <a style={styles.link} href={supportUrl}>{supportUrl}</a></> : ''} immediately and reset your password.
    </Text>
  </Shell>
)

export const template = {
  component: Email,
  subject: `Your ${SITE} phone number was changed`,
  displayName: 'Phone number changed',
  previewData: {
    siteName: SITE,
    fullName: 'Arjun',
    oldPhone: '+91 •••••• 1234',
    newPhone: '+91 •••••• 5678',
    changedAt: 'Jun 12, 2026 · 10:32 AM IST',
  },
} satisfies TemplateEntry
