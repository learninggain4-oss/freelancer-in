/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Hr, Link, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles } from './_brand.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Shell preview={`You've been invited to join ${siteName}`} siteName={siteName} siteUrl={siteUrl}>
    <Heading style={styles.h1}>You're invited to join {siteName} 🎉</Heading>
    <Text style={styles.text}>
      Someone has invited you to collaborate on <strong>{siteName}</strong>. Accept the
      invitation below to create your account and get started.
    </Text>
    <div style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Accept invitation
      </Button>
    </div>
    <Text style={styles.altLink}>
      Or copy and paste this link in your browser:<br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <Hr style={styles.divider} />
    <Text style={styles.security}>
      🔒 This invitation is personal to you. If you weren't expecting it, you can ignore this
      email.
    </Text>
  </Shell>
)

export default InviteEmail
