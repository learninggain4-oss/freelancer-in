/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Hr, Link, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles } from './_brand.tsx'

interface RecoveryEmailProps {
  siteName: string
  siteUrl?: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, siteUrl, confirmationUrl }: RecoveryEmailProps) => (
  <Shell preview={`Reset your ${siteName} password`} siteName={siteName} siteUrl={siteUrl}>
    <Heading style={styles.h1}>Reset your password</Heading>
    <Text style={styles.text}>
      We received a request to reset the password for your <strong>{siteName}</strong> account.
      Click the button below to choose a new password.
    </Text>
    <div style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Reset password
      </Button>
    </div>
    <Text style={styles.altLink}>
      Or copy and paste this link in your browser:<br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <Hr style={styles.divider} />
    <Text style={styles.security}>
      🔒 This link will expire shortly. If you didn't request a password reset, you can ignore
      this email — your password will remain unchanged.
    </Text>
  </Shell>
)

export default RecoveryEmail
