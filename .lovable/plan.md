

## Plan: Add Normal CAPTCHA to Login Page

### Overview
Add a simple math-based CAPTCHA (e.g., "What is 5 + 3?") directly on the login form. This is a lightweight, self-contained solution that requires no external services or API keys.

### Approach
- Generate a random simple math question (addition of two single-digit numbers)
- Display it above the Sign In button
- User must type the correct answer before submitting
- Regenerate the CAPTCHA on each page load and after failed attempts

### Changes

**1. `src/pages/Login.tsx`**
- Add state for two random numbers (`captchaA`, `captchaB`) and user's `captchaAnswer`
- Add a helper function `regenerateCaptcha()` that picks new random numbers and clears the answer
- Call `regenerateCaptcha()` on mount and after failed login attempts
- Render a CAPTCHA section between the terms checkbox and the Sign In button:
  - Display: "What is {a} + {b} = ?" with an input field
  - Style it with a light background box to look distinct
- Disable the Sign In button unless the CAPTCHA answer is correct (`parseInt(captchaAnswer) === captchaA + captchaB`)
- On form submission, validate the CAPTCHA answer first; if wrong, show a toast error and regenerate

### Technical Details
- Pure client-side math CAPTCHA — no backend changes needed
- No external dependencies or API keys required
- Random numbers between 1-9 to keep it simple

