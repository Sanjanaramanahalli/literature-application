# Issue: Fix Google OAuth Error 400: origin_mismatch in Production

## Issue Summary
Google OAuth login fails in production with `Error 400: origin_mismatch`, preventing Readers from signing in using Google.

## Current behavior
Clicking **Continue with Google** displays an authorization error instead of the official Google account chooser.

## Expected behavior
Google OAuth should work correctly in production, allowing Readers to select their Google account and sign in successfully.

## Testing

### ✅ Positive Test Cases — Blueprint

| # | Scenario | Steps | Expected Outcome | Not Expected Outcome |
|---|---|---|---|---|
| 1 | Google login with a valid account | Open the deployed application and click Continue with Google. Select a valid Google account. | Official Google account chooser opens, and login succeeds. | `origin_mismatch` error or login failure occurs. |
| 2 | Login with another Google account | Click Continue with Google and select another available account. | Selected account is authenticated correctly. | Wrong account is logged in or authentication fails. |
| 3 | Successful login session | Complete Google login and refresh the application. | User remains authenticated according to the existing session settings. | User is unexpectedly logged out or the session fails. |

### ❌ Negative Test Cases

| # | Scenario | Expected Outcome | Not Expected Outcome |
|---|---|---|---|
| 1 | OAuth request uses an unregistered origin | Google rejects the unauthorized request securely and the application handles the error gracefully. | Unauthorized login succeeds or security validation is bypassed. |
| 2 | User cancels Google login | User returns to the application with a clear cancellation state and can retry. | Application crashes or creates an invalid session. |
| 3 | Invalid or mismatched redirect URI | Authentication is rejected safely, and the error is handled appropriately. | Login succeeds with an invalid callback or the application crashes. |
| 4 | Google authentication is unsuccessful | User remains unauthenticated and receives an appropriate error message. | An unauthenticated user gains access to protected features. |

## Implementation & Architecture Details

1. **Client ID**: `892874567274-29c1ch5pis8v4inec1bcol07ulv238g9.apps.googleusercontent.com`
2. **Authorized JavaScript Origins**:
   - `https://literature-application.vercel.app` (Production)
   - `http://localhost:5173` (Local Dev)
   - `http://localhost:5000` (Local API / Preview)
3. **Authorized Redirect URIs**:
   - `https://literature-application.vercel.app`
   - `http://localhost:5173`
4. **Token Verification**:
   - Cryptographic server-side verification using `google-auth-library` OAuth2Client.
   - Dynamic origin handling in frontend via Google Identity Services (GIS) `initTokenClient`.
