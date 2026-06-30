/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Hr, Link, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles } from './_brand.tsx'

interface EmailChangeEmailProps {
  siteName: string
  siteUrl?: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  siteUrl,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Shell preview={`Confirm your new email for ${siteName}`} siteName={siteName} siteUrl={siteUrl}>
    <Heading style={styles.h1}>Confirm your new email address</Heading>
    <Text style={styles.text}>
      You requested to change the email address on your <strong>{siteName}</strong> account.
      Please confirm the change below.
    </Text>
    <div style={styles.infoBox}>
      <Text style={styles.infoRow}>
        <strong>From:</strong> {oldEmail}
      </Text>
      <Text style={styles.infoRow}>
        <strong>To:</strong> {newEmail}
      </Text>
    </div>
    <div style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Confirm email change
      </Button>
    </div>
    <Text style={styles.altLink}>
      Or copy and paste this link in your browser:<br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <Hr style={styles.divider} />
    <Text style={styles.security}>
      🔒 If you did not request this change, please secure your account immediately by
      resetting your password.
    </Text>
  </Shell>
)

export default EmailChangeEmail
