/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Heading, Hr, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles } from './_brand.tsx'

interface EmailChangeNoticeProps {
  siteName: string
  siteUrl?: string
  oldEmail: string
  newEmail: string
}

export const EmailChangeNoticeEmail = ({
  siteName,
  siteUrl,
  oldEmail,
  newEmail,
}: EmailChangeNoticeProps) => (
  <Shell preview={`Security notice: email change requested on ${siteName}`} siteName={siteName} siteUrl={siteUrl}>
    <Heading style={styles.h1}>Security notice</Heading>
    <Text style={styles.text}>
      A request was made to change the email address on your <strong>{siteName}</strong> account.
      No action is needed from this address — the verification code has been sent to the new email
      address for confirmation.
    </Text>
    <div style={styles.infoBox}>
      <Text style={styles.infoRow}>
        <strong>Current email:</strong> {oldEmail}
      </Text>
      <Text style={styles.infoRow}>
        <strong>New email:</strong> {newEmail}
      </Text>
    </div>
    <Hr style={styles.divider} />
    <Text style={styles.security}>
      🔒 If you did not request this change, please secure your account immediately by resetting
      your password and contacting support.
    </Text>
  </Shell>
)

export default EmailChangeNoticeEmail
