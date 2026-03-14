# Example: Verify Implementation Against Specifications

## Scenario

A team implemented a user authentication module based on specifications extracted earlier. They need to verify the implementation satisfies all specs and identify any gaps before release.

## User Prompt

> Verify this authentication implementation against our specifications:
>
> **Specifications:**
> - SPEC-101: GIVEN valid credentials WHEN the user logs in THEN a JWT access token (15min expiry) and refresh token (7day expiry) are returned.
> - SPEC-102: GIVEN an expired access token WHEN the user makes an API request THEN a 401 is returned with code TOKEN_EXPIRED.
> - SPEC-103: GIVEN a valid refresh token WHEN the user requests token refresh THEN a new access token is returned and the old refresh token is revoked.
> - SPEC-104: GIVEN 5 failed login attempts WHEN the user attempts a 6th login THEN the account is locked for 15 minutes.
> - SPEC-105: GIVEN a locked account WHEN the lock period expires THEN the user can log in normally.
>
> **Implementation:**
> ```python
> class AuthService:
>     def login(self, email, password):
>         user = self.user_repo.find_by_email(email)
>         if not user or not verify_password(password, user.password_hash):
>             raise InvalidCredentialsError()
>         access_token = create_jwt(user.id, expires_in=900)
>         refresh_token = create_refresh_token(user.id, expires_in=604800)
>         return {"access_token": access_token, "refresh_token": refresh_token}
>
>     def refresh(self, refresh_token):
>         payload = verify_refresh_token(refresh_token)
>         if not payload:
>             raise InvalidTokenError()
>         new_access = create_jwt(payload["user_id"], expires_in=900)
>         return {"access_token": new_access}
>
>     def verify_access(self, token):
>         payload = decode_jwt(token)
>         if not payload:
>             raise AuthenticationError("TOKEN_EXPIRED")
>         return payload
> ```

## Expected Response

### Verification Report

| Spec ID  | Status           | Evidence                                              |
|----------|------------------|-------------------------------------------------------|
| SPEC-101 | SATISFIED        | `login()` creates JWT with 900s (15min) and refresh with 604800s (7day). Token pair returned correctly. |
| SPEC-102 | PARTIALLY MET    | `verify_access()` raises `AuthenticationError("TOKEN_EXPIRED")` but does not distinguish between expired and invalid tokens. |
| SPEC-103 | NOT SATISFIED    | `refresh()` creates a new access token but does NOT revoke the old refresh token. Token reuse attack vector. |
| SPEC-104 | NOT SATISFIED    | No failed login attempt tracking. No account locking mechanism. Entire spec is unimplemented. |
| SPEC-105 | NOT SATISFIED    | Depends on SPEC-104 which is unimplemented. No lock expiry logic exists. |

### Summary

- **Satisfied**: 1/5 (20%)
- **Partially met**: 1/5 (20%)
- **Not satisfied**: 3/5 (60%)

### Gap Details

**SPEC-103: Missing refresh token revocation**

The `refresh()` method issues a new access token but leaves the old refresh token valid. This means:
- A stolen refresh token can be used indefinitely.
- There is no way to detect token reuse (a common indicator of compromise).

**Recommended fix**:
```python
def refresh(self, refresh_token):
    payload = verify_refresh_token(refresh_token)
    if not payload:
        raise InvalidTokenError()
    # Revoke old refresh token
    self.token_repo.revoke(refresh_token)
    # Issue new token pair
    new_access = create_jwt(payload["user_id"], expires_in=900)
    new_refresh = create_refresh_token(payload["user_id"], expires_in=604800)
    return {"access_token": new_access, "refresh_token": new_refresh}
```

**SPEC-104 and SPEC-105: Missing account locking**

The login method has no tracking of failed attempts. Implementation needed:
1. Add a `failed_attempts` counter and `locked_until` timestamp to the user model.
2. Increment `failed_attempts` on each failed login.
3. When `failed_attempts >= 5`, set `locked_until = now + 15 minutes`.
4. Check `locked_until` before validating credentials.
5. Reset `failed_attempts` on successful login.

### Verification Tests to Add

```python
def test_spec_103_refresh_revokes_old_token():
    # Arrange: login and get tokens
    tokens = auth.login("user@test.com", "password")
    # Act: refresh to get new tokens
    new_tokens = auth.refresh(tokens["refresh_token"])
    # Assert: old refresh token is no longer valid
    with pytest.raises(InvalidTokenError):
        auth.refresh(tokens["refresh_token"])

def test_spec_104_account_locks_after_5_failures():
    # Arrange: valid user exists
    # Act: attempt login 6 times with wrong password
    for i in range(5):
        with pytest.raises(InvalidCredentialsError):
            auth.login("user@test.com", "wrong")
    # Assert: 6th attempt raises AccountLockedError
    with pytest.raises(AccountLockedError):
        auth.login("user@test.com", "correct_password")

def test_spec_105_lock_expires_after_15_minutes():
    # Arrange: lock the account by failing 5 times
    # Act: advance time by 16 minutes
    # Assert: login succeeds with correct password
```

## Why This Response Works

- Provides a spec-by-spec verification with clear status and evidence.
- Distinguishes between "not satisfied" and "partially met" which is important for prioritization.
- Identifies a security-relevant gap (refresh token reuse) that could be exploited.
- Provides concrete code fixes, not just descriptions of what is wrong.
- Includes test cases that would catch these gaps in the future.
