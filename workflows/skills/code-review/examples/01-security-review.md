# Example: Security-Focused Code Review

## Scenario

A junior developer submits a PR adding a password reset flow. The reviewer needs to identify security issues while providing constructive, educational feedback.

## User Prompt

> Review this password reset endpoint for security issues:
>
> ```javascript
> app.post('/api/reset-password', async (req, res) => {
>   const { email } = req.body;
>   const user = await User.findOne({ email });
>   if (!user) return res.status(404).json({ error: 'User not found' });
>
>   const token = Math.random().toString(36).substring(2);
>   user.resetToken = token;
>   user.resetTokenExpiry = Date.now() + 3600000;
>   await user.save();
>
>   await sendEmail(email, `Reset your password: https://app.com/reset?token=${token}`);
>   res.json({ message: 'Reset email sent' });
> });
>
> app.post('/api/reset-password/confirm', async (req, res) => {
>   const { token, newPassword } = req.body;
>   const user = await User.findOne({ resetToken: token });
>   if (!user) return res.status(400).json({ error: 'Invalid token' });
>
>   user.password = newPassword;
>   user.resetToken = null;
>   user.resetTokenExpiry = null;
>   await user.save();
>   res.json({ message: 'Password updated' });
> });
> ```

## Expected Response

### Summary

This password reset implementation has the core flow correct but contains several security vulnerabilities that must be addressed before merge. The issues range from weak token generation to user enumeration and missing token expiry validation.

### Blocking Issues

**1. Weak token generation**

- **What**: `Math.random()` is not cryptographically secure and produces predictable tokens.
- **Why**: An attacker can predict future tokens by observing a sample of generated tokens, enabling account takeover.
- **How**: Use `crypto.randomBytes(32).toString('hex')` for cryptographically secure tokens.

**2. User enumeration via 404**

- **What**: Returning 404 when the email is not found reveals which emails are registered.
- **Why**: Attackers can enumerate valid accounts by brute-forcing the reset endpoint.
- **How**: Always return the same 200 response ("If an account exists, a reset email has been sent") regardless of whether the email exists.

**3. Token expiry not checked**

- **What**: The confirm endpoint checks if the token exists but does not check `resetTokenExpiry`.
- **Why**: Expired tokens remain valid forever, giving attackers unlimited time to guess or intercept tokens.
- **How**: Add `resetTokenExpiry: { $gt: Date.now() }` to the query filter.

**4. Password stored without hashing**

- **What**: `user.password = newPassword` stores the password in plaintext.
- **Why**: A database breach exposes all user passwords in cleartext.
- **How**: Hash with bcrypt before storing: `user.password = await bcrypt.hash(newPassword, 12)`.

### Suggestions

**5. No password strength validation**

- The confirm endpoint accepts any password, including empty strings and single characters.
- Add minimum length (8+), complexity requirements, or use zxcvbn for strength estimation.

**6. Token not invalidated on use**

- If the save fails after setting the new password, the token remains valid.
- Use a database transaction to ensure atomicity.

### Positive Callout

The separation of the request and confirm endpoints into two steps is the correct pattern. The 1-hour token expiry intention (3600000ms) is a reasonable default.

### Verdict

**Request Changes** — the blocking issues (weak token, user enumeration, missing expiry check, plaintext password) are all security vulnerabilities that must be fixed before merge.

## Why This Response Works

- Every issue follows WHAT-WHY-HOW with specific code suggestions.
- Issues are categorized by severity (blocking vs suggestion).
- The feedback is educational without being condescending.
- A positive callout reinforces what the author did correctly.
- The verdict is clear with specific rationale.
