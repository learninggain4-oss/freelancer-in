/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Heading, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles, brand } from './_brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  siteName?: string
  siteUrl?: string
  fullName?: string
  oldEmail?: string
  newEmail?: string
  changedAt?: string
  supportUrl?: string
}

const SITE = 'Freelancer-in'

const Email = ({
  siteName = SITE,
  siteUrl,
  fullName,
  oldEmail,
  newEmail,
  changedAt,
  supportUrl,
}: Props) => (
  <Shell
    preview={`Your ${siteName} email address was changed`}
    siteName={siteName}
    siteUrl={siteUrl}
    accent={brand.accent}
  >
    <Text style={styles.badge(brand.accent)}>✓ Email updated</Text>
    <Heading style={styles.h1}>Your email address was changed</Heading>
    <Text style={styles.text}>
      Hi {fullName || 'there'}, the email address linked to your{' '}
      <strong>{siteName}</strong> account has been updated successfully.
    </Text>
    <div style={styles.infoBox}>
      {oldEmail && (
        <Text style={styles.infoRow}>
          <strong>Previous:</strong> {oldEmail}
        </Text>
      )}
      {newEmail && (
        <Text style={styles.infoRow}>
          <strong>New:</strong> {newEmail}
        </Text>
      )}
      {changedAt && (
        <Text style={styles.infoRow}>
          <strong>When:</strong> {changedAt}
        </Text>
      )}
    </div>
    <Text style={styles.alert}>
      ⚠️ If this wasn't you, contact our support team
      {supportUrl ? <> at <a style={styles.link} href={supportUrl}>{supportUrl}</a></> : ''} right away to secure your account.
    </Text>
  </Shell>
)

export const template = {
  component: Email,
  subject: `Your ${SITE} email address was changed`,
  displayName: 'Email address changed',
  previewData: {
    siteName: SITE,
    fullName: 'Arjun',
    oldEmail: 'old@example.com',
    newEmail: 'new@example.com',
    changedAt: 'Jun 12, 2026 · 10:32 AM IST',
  },
} satisfies TemplateEntry
