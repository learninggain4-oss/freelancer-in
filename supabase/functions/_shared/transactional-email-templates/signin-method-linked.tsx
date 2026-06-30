/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Heading, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles, brand } from './_brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  siteName?: string
  siteUrl?: string
  fullName?: string
  provider?: string
  linkedAt?: string
  ipAddress?: string
  supportUrl?: string
}

const SITE = 'Freelancer-in'

const Email = ({
  siteName = SITE,
  siteUrl,
  fullName,
  provider,
  linkedAt,
  ipAddress,
  supportUrl,
}: Props) => (
  <Shell
    preview={`New sign-in method linked to your ${siteName} account`}
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Text style={styles.badge(brand.primary)}>🔗 Sign-in method linked</Text>
    <Heading style={styles.h1}>A new sign-in method was linked</Heading>
    <Text style={styles.text}>
      Hi {fullName || 'there'}, a new sign-in method was just linked to your{' '}
      <strong>{siteName}</strong> account. You can now use it to log in.
    </Text>
    <div style={styles.infoBox}>
      {provider && (
        <Text style={styles.infoRow}>
          <strong>Method:</strong> {provider}
        </Text>
      )}
      {linkedAt && (
        <Text style={styles.infoRow}>
          <strong>When:</strong> {linkedAt}
        </Text>
      )}
      {ipAddress && (
        <Text style={styles.infoRow}>
          <strong>IP address:</strong> {ipAddress}
        </Text>
      )}
    </div>
    <Text style={styles.alert}>
      ⚠️ If you didn't link this method, unlink it from your account settings and contact
      support{supportUrl ? <> at <a style={styles.link} href={supportUrl}>{supportUrl}</a></> : ''} right away.
    </Text>
  </Shell>
)

export const template = {
  component: Email,
  subject: `New sign-in method linked to your ${SITE} account`,
  displayName: 'Sign-in method linked',
  previewData: {
    siteName: SITE,
    fullName: 'Arjun',
    provider: 'Google',
    linkedAt: 'Jun 12, 2026 · 10:32 AM IST',
    ipAddress: '203.0.113.42',
  },
} satisfies TemplateEntry
