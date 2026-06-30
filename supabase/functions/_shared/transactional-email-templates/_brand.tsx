/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
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
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  surface: '#F8FAFC',
  white: '#FFFFFF',
  font:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif",
}

export const styles = {
  main: { backgroundColor: '#ffffff', fontFamily: brand.font, margin: 0 } as React.CSSProperties,
  outer: { backgroundColor: '#F1F5F9', padding: '32px 12px' } as React.CSSProperties,
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    backgroundColor: brand.white,
    borderRadius: '16px',
    overflow: 'hidden',
    border: `1px solid ${brand.border}`,
    boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  } as React.CSSProperties,
  header: (accent = brand.primary) =>
    ({
      background: `linear-gradient(135deg, ${accent} 0%, ${brand.primaryDark} 100%)`,
      padding: '28px 32px',
      textAlign: 'center' as const,
    }) as React.CSSProperties,
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
  badge: (color: string) =>
    ({
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '999px',
      background: `${color}1A`,
      color,
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.4px',
      textTransform: 'uppercase' as const,
      margin: '0 0 14px',
    }) as React.CSSProperties,
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
  infoBox: {
    background: brand.surface,
    border: `1px solid ${brand.border}`,
    borderRadius: '12px',
    padding: '14px 16px',
    margin: '8px 0 16px',
  } as React.CSSProperties,
  infoRow: { fontSize: '13px', color: brand.text, margin: '4px 0' } as React.CSSProperties,
  alert: {
    background: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '12px',
    padding: '12px 14px',
    color: '#92400E',
    fontSize: '13px',
    lineHeight: 1.6,
    margin: '8px 0 12px',
  } as React.CSSProperties,
  link: { color: brand.primary, textDecoration: 'underline' } as React.CSSProperties,
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
  accent?: string
  children: React.ReactNode
}

export const Shell = ({
  preview,
  siteName,
  siteUrl,
  accent = brand.primary,
  children,
}: ShellProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={styles.main}>
      <Section style={styles.outer}>
        <Container style={styles.container}>
          <Section style={styles.header(accent)}>
            <Text style={styles.brandName}>{siteName}</Text>
            <Text style={styles.brandTag}>Account security alert</Text>
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
              You're receiving this email because important changes were made to your account.
            </Text>
          </Section>
        </Container>
      </Section>
    </Body>
  </Html>
)
