/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Heading, Hr, Text } from 'npm:@react-email/components@0.0.22'
import { Shell, styles } from './_brand.tsx'

interface ReauthenticationEmailProps {
  siteName?: string
  siteUrl?: string
  token: string
}

export const ReauthenticationEmail = ({
  siteName = 'Freelancer-in',
  siteUrl,
  token,
}: ReauthenticationEmailProps) => (
  <Shell preview="Your verification code" siteName={siteName} siteUrl={siteUrl}>
    <Heading style={styles.h1}>Confirm it's really you</Heading>
    <Text style={styles.text}>
      We need to verify your identity before completing this sensitive action on your
      <strong> {siteName}</strong> account. Use the one-time code below to continue.
    </Text>
    <div style={styles.codeBox}>{token}</div>
    <Text style={styles.muted}>
      Enter this code in the open verification screen. It expires in a few minutes.
    </Text>
    <Hr style={styles.divider} />
    <Text style={styles.security}>
      🔒 Never share this code with anyone — not even {siteName} staff. If you didn't request
      it, please change your password right away.
    </Text>
  </Shell>
)

export default ReauthenticationEmail
