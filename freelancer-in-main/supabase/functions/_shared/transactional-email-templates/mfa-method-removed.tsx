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
  removedAt?: string
  supportUrl?: string
}

const SITE = 'Freelancer-in'

const Email = ({
  siteName = SITE,
  siteUrl,
  fullName,
  factorType,
  factorName,
  removedAt,
  supportUrl,
}: Props) => (
  <Shell
    preview={`An MFA method was removed from your ${siteName} account`}
    siteName={siteName}
    siteUrl={siteUrl}
    accent={brand.danger}
  >
    <Text style={styles.badge(brand.danger)}>⚠️ MFA removed</Text>
    <Heading style={styles.h1}>An MFA method was removed</Heading>
    <Text style={styles.text}>
      Hi {fullName || 'there'}, a two-factor authentication method was just removed from
      your <strong>{siteName}</strong> account. Your account security may now be reduced.
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
      {removedAt && (
        <Text style={styles.infoRow}>
          <strong>When:</strong> {removedAt}
        </Text>
      )}
    </div>
    <Text style={styles.alert}>
      ⚠️ If you didn't remove this method, re-enable MFA immediately and contact support
      {supportUrl ? <> at <a style={styles.link} href={supportUrl}>{supportUrl}</a></> : ''}.
    </Text>
  </Shell>
)

export const template = {
  component: Email,
  subject: `An MFA method was removed from your ${SITE} account`,
  displayName: 'MFA method removed',
  previewData: {
    siteName: SITE,
    fullName: 'Arjun',
    factorType: 'Authenticator app (TOTP)',
    factorName: 'iPhone Authenticator',
    removedAt: 'Jun 12, 2026 · 10:32 AM IST',
  },
} satisfies TemplateEntry
