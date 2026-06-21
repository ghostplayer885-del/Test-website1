// This file contains the enhanced LoginForm component with:
// 1. Countdown timer showing token validity (5 minutes)
// 2. "Resend Token" button with 60-second cooldown
// 3. Specific error messages for expired, invalid, or already-used tokens

// Key additions to LoginForm:
// - step state: "credentials" | "verify" | "token"
// - tokenCountdown: tracks remaining time (0-300 seconds)
// - resendCooldown: tracks resend button cooldown (0-60 seconds)
// - tokenError: stores specific error message
// - loginWithTokenMutation: handles token verification
// - useEffect hooks: manage countdown timers
// - handleTokenLogin: submit token for verification
// - handleResendToken: trigger new token generation with cooldown

// UI Components:
// - Token input field
// - Countdown timer display (Clock icon + "Token expires in: Xs")
// - Error message display (XCircle icon + error text)
// - "Login with Token" button
// - "Resend Token" button (disabled during cooldown)
// - "Back to Login" button
// - "Or" divider on credentials form
// - "Login with Token" button on credentials form

// Error Messages:
// - "Token has expired. Please request a new one."
// - "Token has already been used. Please request a new one."
// - "Invalid token. Please check and try again."

