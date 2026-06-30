/// <reference types="npm:@types/react@18.3.1" />

import type { ComponentType } from 'npm:react@18.3.1'

import { template as passwordChanged } from './password-changed.tsx'
import { template as emailAddressChanged } from './email-address-changed.tsx'
import { template as phoneNumberChanged } from './phone-number-changed.tsx'
import { template as signinMethodLinked } from './signin-method-linked.tsx'
import { template as mfaMethodAdded } from './mfa-method-added.tsx'
import { template as mfaMethodRemoved } from './mfa-method-removed.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string | ((data: Record<string, any>) => string)
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'password-changed': passwordChanged,
  'email-address-changed': emailAddressChanged,
  'phone-number-changed': phoneNumberChanged,
  'signin-method-linked': signinMethodLinked,
  'mfa-method-added': mfaMethodAdded,
  'mfa-method-removed': mfaMethodRemoved,
}
