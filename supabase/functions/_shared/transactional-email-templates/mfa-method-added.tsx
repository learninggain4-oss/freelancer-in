/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Heading, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles, brand } from './_brand.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  siteName?: string
  siteUrl?: string
  fullName?: string
  factorType?: string
  factorName?: string
  addedAt?: string
  supportUrl?: string
}

const SITE = 'Freelancer-in'

const Email = ({
  siteName = SITE,
  siteUrl,
  fullName,
  factorType,
  factorName,
  addedAt,
  supportUrl,
}: Props) => (
  <Shell
    preview={`Two-factor authentication enabled on your ${siteName} account`}
    siteName={siteName}
    siteUrl={siteUrl}
    accent={brand.accent}
  >
    <Text style={styles.badge(brand.accent)}>🛡️ MFA enabled</Text>
    <Heading style={styles.h1}>A new MFA method was added</Heading>
    <Text style={styles.text}>
      Hi {fullName || 'there'}, two-factor authentication has been strengthened on your{' '}
      <strong>{siteName}</strong> account. From now on, you'll be asked for an additional
      verification step when signing in.
    </Text>
    <div style={styles.infoBox}>
      {factorType && (
        <Text style={styles.infoRow}>
          <strong>Type:</strong> {factorType}
        </Text>
      )}
      {factorName && (
        <Text style={styles.infoRow}>
          <strong>Name:</strong> {factorName}
        </Text>
      )}
      {addedAt && (
        <Text style={styles.infoRow}>
          <strong>When:</strong> {addedAt}
        </Text>
      )}
    </div>
    <Text style={styles.alert}>
      ⚠️ If you didn't enable this, remove the factor from your security settings and contact
      support{supportUrl ? <> at <a style={styles.link} href={supportUrl}>{supportUrl}</a></> : ''} immediately.
    </Text>
  </Shell>
)

export const template = {
  component: Email,
  subject: `Two-factor authentication added to your ${SITE} account`,
  displayName: 'MFA method added',
  previewData: {
    siteName: SITE,
    fullName: 'Arjun',
    factorType: 'Authenticator app (TOTP)',
    factorName: 'iPhone Authenticator',
    addedAt: 'Jun 12, 2026 · 10:32 AM IST',
  },
} satisfies TemplateEntry
