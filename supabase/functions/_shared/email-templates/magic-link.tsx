/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Hr, Link, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles } from './_brand.tsx'

interface MagicLinkEmailProps {
  siteName: string
  siteUrl?: string
  confirmationUrl: string
  token?: string
}

export const MagicLinkEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
  token,
}: MagicLinkEmailProps) => (
  <Shell preview={`Your secure login link for ${siteName}`} siteName={siteName} siteUrl={siteUrl}>
    <Heading style={styles.h1}>Your secure login link</Heading>
    <Text style={styles.text}>
      Use the button below to sign in to <strong>{siteName}</strong>. No password needed —
      this single-use link signs you in instantly.
    </Text>
    <div style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Sign in to {siteName}
      </Button>
    </div>
    {token && (
      <>
        <Text style={styles.muted}>Or enter this one-time code in the app:</Text>
        <div style={styles.codeBox}>{token}</div>
      </>
    )}
    <Text style={styles.altLink}>
      Or copy and paste this link in your browser:<br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <Hr style={styles.divider} />
    <Text style={styles.security}>
      🔒 This link expires shortly and can only be used once. If you didn't request it,
      please ignore this email.
    </Text>
  </Shell>
)

export default MagicLinkEmail
