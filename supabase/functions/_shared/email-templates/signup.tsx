/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Hr, Link, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles } from './_brand.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Shell preview={`Confirm your email for ${siteName}`} siteName={siteName} siteUrl={siteUrl}>
    <Heading style={styles.h1}>Confirm your email address</Heading>
    <Text style={styles.text}>
      Welcome to <strong>{siteName}</strong>! We're glad you're here. To activate your account
      ({recipient}), please confirm your email address by clicking the button below.
    </Text>
    <div style={styles.buttonWrap}>
      <Button style={styles.button} href={confirmationUrl}>
        Verify my email
      </Button>
    </div>
    <Text style={styles.altLink}>
      Or copy and paste this link in your browser:<br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <Hr style={styles.divider} />
    <Text style={styles.security}>
      🔒 This confirmation link will expire shortly for your security. If you didn't create an
      account on {siteName}, you can safely ignore this email.
    </Text>
  </Shell>
)

export default SignupEmail
