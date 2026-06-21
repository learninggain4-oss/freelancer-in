/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

export const brand = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  accent: '#10B981',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  surface: '#F8FAFC',
  white: '#FFFFFF',
  radius: '12px',
  font:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif",
}

export const styles = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily: brand.font,
    margin: 0,
    padding: '0',
  } as React.CSSProperties,
  outer: {
    backgroundColor: '#F1F5F9',
    padding: '32px 12px',
  } as React.CSSProperties,
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    backgroundColor: brand.white,
    borderRadius: '16px',
    overflow: 'hidden',
    border: `1px solid ${brand.border}`,
    boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  } as React.CSSProperties,
  header: {
    background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
    padding: '28px 32px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  brandName: {
    color: brand.white,
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '-0.3px',
    margin: 0,
  } as React.CSSProperties,
  brandTag: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '12px',
    margin: '6px 0 0',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  body: { padding: '32px 32px 24px' } as React.CSSProperties,
  h1: {
    color: brand.text,
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 12px',
    lineHeight: 1.3,
  } as React.CSSProperties,
  text: {
    color: '#334155',
    fontSize: '15px',
    lineHeight: 1.65,
    margin: '0 0 16px',
  } as React.CSSProperties,
  muted: {
    color: brand.muted,
    fontSize: '13px',
    lineHeight: 1.6,
    margin: '0 0 8px',
  } as React.CSSProperties,
  buttonWrap: {
    textAlign: 'center' as const,
    padding: '12px 0 8px',
  } as React.CSSProperties,
  button: {
    backgroundColor: brand.primary,
    color: brand.white,
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: brand.radius,
    padding: '14px 28px',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 6px 16px rgba(37,99,235,0.35)',
  } as React.CSSProperties,
  codeBox: {
    margin: '8px 0 20px',
    padding: '18px',
    background: brand.surface,
    border: `1px dashed ${brand.primary}`,
    borderRadius: brand.radius,
    textAlign: 'center' as const,
    fontSize: '30px',
    letterSpacing: '10px',
    fontWeight: 700,
    color: brand.primary,
  } as React.CSSProperties,
  infoBox: {
    background: brand.surface,
    border: `1px solid ${brand.border}`,
    borderRadius: brand.radius,
    padding: '14px 16px',
    margin: '8px 0 16px',
  } as React.CSSProperties,
  infoRow: {
    fontSize: '13px',
    color: brand.text,
    margin: '4px 0',
  } as React.CSSProperties,
  link: { color: brand.primary, textDecoration: 'underline' } as React.CSSProperties,
  altLink: {
    fontSize: '12px',
    color: brand.muted,
    wordBreak: 'break-all' as const,
    margin: '12px 0 0',
  } as React.CSSProperties,
  divider: {
    borderColor: brand.border,
    margin: '24px 0 16px',
  } as React.CSSProperties,
  security: {
    fontSize: '12px',
    color: brand.muted,
    lineHeight: 1.6,
    margin: '0 0 8px',
  } as React.CSSProperties,
  footer: {
    padding: '20px 32px 28px',
    textAlign: 'center' as const,
    background: brand.surface,
    borderTop: `1px solid ${brand.border}`,
  } as React.CSSProperties,
  footerText: {
    color: brand.muted,
    fontSize: '12px',
    lineHeight: 1.6,
    margin: '0 0 4px',
  } as React.CSSProperties,
}

interface ShellProps {
  preview: string
  siteName: string
  siteUrl?: string
  children: React.ReactNode
}

export const Shell = ({ preview, siteName, siteUrl, children }: ShellProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={styles.main}>
      <Section style={styles.outer}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.brandName}>{siteName}</Text>
            <Text style={styles.brandTag}>Secure account notification</Text>
          </Section>
          <Section style={styles.body}>{children}</Section>
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </Text>
            {siteUrl && (
              <Text style={styles.footerText}>
                <Link href={siteUrl} style={styles.link}>
                  {siteUrl.replace(/^https?:\/\//, '')}
                </Link>
              </Text>
            )}
            <Text style={styles.footerText}>
              This is an automated message — please do not reply.
            </Text>
          </Section>
        </Container>
      </Section>
    </Body>
  </Html>
)
