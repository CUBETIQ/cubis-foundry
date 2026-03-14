# Example: TDD Red-Green-Refactor for a Password Strength Validator

## Context

Building a `PasswordValidator.checkStrength(password)` function from scratch using strict TDD. Each requirement is added one cycle at a time.

## User Prompt

> I need a password strength validator that returns "weak", "medium", or "strong". Use TDD to build it. Requirements: weak = under 8 chars, medium = 8+ chars with letters and numbers, strong = 12+ chars with letters, numbers, and symbols.

## Skill Response

### Cycle 1: Weak Password (Under 8 Characters)

**RED -- Write the failing test first:**

```python
# test_password_validator.py
from password_validator import PasswordValidator

def test_short_password_is_weak():
    validator = PasswordValidator()
    assert validator.check_strength("abc") == "weak"

def test_empty_password_is_weak():
    validator = PasswordValidator()
    assert validator.check_strength("") == "weak"
```

Run: `pytest` -- FAILS with `ModuleNotFoundError`. The test fails for the right reason: the module does not exist yet.

**GREEN -- Write minimum code to pass:**

```python
# password_validator.py
class PasswordValidator:
    def check_strength(self, password: str) -> str:
        return "weak"
```

Run: `pytest` -- PASSES. Both tests pass because everything returns "weak".

**REFACTOR:** No duplication to remove yet. Move on.

---

### Cycle 2: Medium Password (8+ Chars with Letters and Numbers)

**RED:**

```python
def test_eight_chars_with_letters_and_numbers_is_medium():
    validator = PasswordValidator()
    assert validator.check_strength("abcd1234") == "medium"

def test_eight_chars_letters_only_is_weak():
    validator = PasswordValidator()
    assert validator.check_strength("abcdefgh") == "weak"
```

Run: `pytest` -- FAILS. `test_eight_chars_with_letters_and_numbers_is_medium` expects "medium" but gets "weak".

**GREEN:**

```python
import re

class PasswordValidator:
    def check_strength(self, password: str) -> str:
        if len(password) >= 8 and re.search(r'[a-zA-Z]', password) and re.search(r'[0-9]', password):
            return "medium"
        return "weak"
```

Run: `pytest` -- PASSES. All four tests green.

**REFACTOR:** Extract character-class checks into helper methods:

```python
import re

class PasswordValidator:
    def check_strength(self, password: str) -> str:
        has_letters = bool(re.search(r'[a-zA-Z]', password))
        has_numbers = bool(re.search(r'[0-9]', password))

        if len(password) >= 8 and has_letters and has_numbers:
            return "medium"
        return "weak"
```

Run: `pytest` -- still PASSES. Refactoring under green is safe.

---

### Cycle 3: Strong Password (12+ Chars with Letters, Numbers, Symbols)

**RED:**

```python
def test_twelve_chars_with_all_types_is_strong():
    validator = PasswordValidator()
    assert validator.check_strength("Abcdef1234!@") == "strong"

def test_twelve_chars_without_symbols_is_medium():
    validator = PasswordValidator()
    assert validator.check_strength("Abcdefgh1234") == "medium"
```

Run: `pytest` -- FAILS. `test_twelve_chars_with_all_types_is_strong` expects "strong" but gets "medium".

**GREEN:**

```python
import re

class PasswordValidator:
    def check_strength(self, password: str) -> str:
        has_letters = bool(re.search(r'[a-zA-Z]', password))
        has_numbers = bool(re.search(r'[0-9]', password))
        has_symbols = bool(re.search(r'[^a-zA-Z0-9]', password))

        if len(password) >= 12 and has_letters and has_numbers and has_symbols:
            return "strong"
        if len(password) >= 8 and has_letters and has_numbers:
            return "medium"
        return "weak"
```

Run: `pytest` -- PASSES. All six tests green.

**REFACTOR:** Extract the analysis into a scored approach:

```python
import re

class PasswordValidator:
    def check_strength(self, password: str) -> str:
        traits = {
            'length_8': len(password) >= 8,
            'length_12': len(password) >= 12,
            'has_letters': bool(re.search(r'[a-zA-Z]', password)),
            'has_numbers': bool(re.search(r'[0-9]', password)),
            'has_symbols': bool(re.search(r'[^a-zA-Z0-9]', password)),
        }

        if all([traits['length_12'], traits['has_letters'],
                traits['has_numbers'], traits['has_symbols']]):
            return "strong"
        if all([traits['length_8'], traits['has_letters'],
                traits['has_numbers']]):
            return "medium"
        return "weak"
```

Run: `pytest` -- still PASSES.

### Edge Case Additions

```python
def test_seven_chars_with_everything_is_still_weak():
    """Length requirement is non-negotiable."""
    validator = PasswordValidator()
    assert validator.check_strength("Ab1!xyz") == "weak"

def test_spaces_count_as_symbols():
    validator = PasswordValidator()
    assert validator.check_strength("Hello World 123") == "strong"
```

### Key Takeaways

1. **Each cycle adds exactly one behavior** -- never implement ahead of the current failing test.
2. **Red proves the test works** -- if the test passed before implementation, it is not testing anything.
3. **Green uses minimal code** -- resist the urge to add future logic.
4. **Refactor is safe because tests are green** -- restructure freely with the safety net.
5. **Edge cases are separate cycles** -- they get their own red-green-refactor iteration.
