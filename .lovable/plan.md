

# Wallet Card Redesign — Modern Gradient Card

## What We're Building

A reusable `WalletCard` component styled like a premium digital bank/credit card with gradient background, decorative elements, and all balance info consolidated into one beautiful card. It will replace the current separate balance cards everywhere they appear.

## Design

```text
┌──────────────────────────────────────────┐
│  ◉ Freelancer Wallet            ₹ LOGO  │  gradient: blue → indigo/purple
│                                          │
│  ₹ 12,500.00                             │  large, bold available balance
│  Available Balance                       │
│                                          │
│  ⏳ ₹2,000 on hold    Total: ₹14,500    │  secondary info row
│                                          │
│  Rajesh Kumar               EMP-001      │  name + user code
│  Wallet: 9876543210         📋           │  wallet number + copy btn
└──────────────────────────────────────────┘
  ● Decorative circles in top-right and bottom-left
  ● Subtle chip/card icon watermark
  ● Smooth shadow and rounded-2xl corners
```

## Implementation Plan

### 1. Create `src/components/wallet/WalletCard.tsx`
- Reusable component with props: `name`, `userCode`, `walletNumber`, `availableBalance`, `holdBalance`, `userType` (employee/client)
- Gradient background: `bg-gradient-to-br from-primary via-blue-600 to-indigo-700`
- Decorative overlay circles for depth
- Copy wallet number on tap
- All white text on gradient

### 2. Update `src/pages/employee/EmployeeWallet.tsx`
- Replace the 2-column grid balance cards (lines 117-130) with `<WalletCard />`

### 3. Update `src/pages/client/ClientWallet.tsx`
- Replace the 2-column grid balance cards (lines 73-90) with `<WalletCard />`

### 4. Update `src/pages/employee/EmployeeDashboard.tsx`
- Replace the hero card + balance split cards (lines 157-213) with `<WalletCard />`

### 5. Update `src/pages/client/ClientDashboard.tsx`
- Replace the hero card + balance split cards (lines 125-180) with `<WalletCard />`

No new dependencies required. Pure Tailwind CSS with existing Lucide icons.

