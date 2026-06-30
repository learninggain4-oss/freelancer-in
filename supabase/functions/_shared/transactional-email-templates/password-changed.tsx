/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Heading, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles, brand } from './_brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  siteName?: string
  siteUrl?: string
  fullName?: string
  changedAt?: string
  ipAddress?: string
  device?: string
  supportUrl?: string
}

const SITE = 'Freelancer-in'

const Email = ({
  siteName = SITE,
  siteUrl,
  fullName,
  changedAt,
  ipAddress,
  device,
  supportUrl,
}: Props) => (
  <Shell
    preview={`Your ${siteName} password was changed`}
    siteName={siteName}
    siteUrl={siteUrl}
    accent={brand.accent}
  >
    <Text style={styles.badge(brand.accent)}>✓ Password updated</Text>
    <Heading style={styles.h1}>Your password was changed</Heading>
    <Text style={styles.text}>
      Hi {fullName || 'there'}, this is a confirmation that the password for your{' '}
      <strong>{siteName}</strong> account was changed successfully.
    </Text>
    <div style={styles.infoBox}>
      {changedAt && (
        <Text style={styles.infoRow}>
          <strong>When:</strong> {changedAt}
        </Text>
      )}
      {device && (
        <Text style={styles.infoRow}>
          <strong>Device:</strong> {device}
        </Text>
      )}
      {ipAddress && (
        <Text style={styles.infoRow}>
          <strong>IP address:</strong> {ipAddress}
        </Text>
      )}
    </div>
    <Text style={styles.alert}>
      ⚠️ If you didn't make this change, reset your password immediately and contact our
      support team{supportUrl ? <> at <a style={styles.link} href={supportUrl}>{supportUrl}</a></> : ''}.
    </Text>
  </Shell>
)

export const template = {
  component: Email,
  subject: `Your ${SITE} password was changed`,
  displayName: 'Password changed',
  previewData: {
    siteName: SITE,
    fullName: 'Arjun',
    changedAt: 'Jun 12, 2026 · 10:32 AM IST',
    ipAddress: '203.0.113.42',
    device: 'Chrome on Android',
  },
} satisfies TemplateEntry
