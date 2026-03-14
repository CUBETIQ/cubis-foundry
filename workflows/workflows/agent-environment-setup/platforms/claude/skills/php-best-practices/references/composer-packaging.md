# Composer Packaging Reference

## PSR-4 Autoloading

### Standard configuration

```json
{
    "autoload": {
        "psr-4": {
            "Acme\\MyPackage\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Acme\\MyPackage\\Tests\\": "tests/"
        }
    }
}
```

### PSR-4 rules

| Namespace | File path | Valid |
| --- | --- | --- |
| `Acme\MyPackage\User` | `src/User.php` | Yes |
| `Acme\MyPackage\Domain\User` | `src/Domain/User.php` | Yes |
| `Acme\MyPackage\User` | `src/Models/User.php` | No — namespace doesn't match |

After changing autoload config, run:
```bash
composer dump-autoload --optimize
```

### Never use manual loading

```php
// BAD — defeats autoloading, creates implicit dependencies
require_once __DIR__ . '/../src/User.php';
include 'helpers.php';

// GOOD — Composer handles everything
use Acme\MyPackage\User;
$user = new User();
```

## composer.json for Libraries

```json
{
    "name": "acme/validation",
    "description": "Type-safe validation library for PHP 8.4+",
    "type": "library",
    "license": "MIT",
    "require": {
        "php": ">=8.4",
        "psr/log": "^3.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^11.0",
        "phpstan/phpstan": "^2.0",
        "friendsofphp/php-cs-fixer": "^3.0"
    },
    "autoload": {
        "psr-4": {
            "Acme\\Validation\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Acme\\Validation\\Tests\\": "tests/"
        }
    },
    "config": {
        "sort-packages": true
    },
    "minimum-stability": "stable",
    "prefer-stable": true,
    "scripts": {
        "test": "phpunit",
        "analyse": "phpstan analyse",
        "cs-fix": "php-cs-fixer fix",
        "cs-check": "php-cs-fixer fix --dry-run --diff",
        "check": ["@cs-check", "@analyse", "@test"]
    }
}
```

## composer.json for Applications

```json
{
    "name": "acme/my-app",
    "type": "project",
    "require": {
        "php": ">=8.4",
        "acme/validation": "^2.0",
        "symfony/http-foundation": "^7.0"
    },
    "config": {
        "optimize-autoloader": true,
        "sort-packages": true
    }
}
```

### Lock file rules

| Context | Commit composer.lock? | Why |
| --- | --- | --- |
| Application | Yes | Reproducible builds — everyone gets same versions |
| Library | No | Consumers need flexibility to resolve their own dependency tree |

## Semantic Versioning

### Version constraints

| Constraint | Meaning | Example |
| --- | --- | --- |
| `^2.0` | `>=2.0.0 <3.0.0` | Most common — allows minor updates |
| `~2.1` | `>=2.1.0 <2.2.0` | Allows patch updates only |
| `2.1.3` | Exact version | Rarely needed — too restrictive |
| `>=2.0 <2.5` | Range | Explicit bounds |
| `*` | Any version | Never use in production |

### When to bump versions

| Change | Version bump | Example |
| --- | --- | --- |
| Breaking API change | Major | 2.x -> 3.0.0 |
| New feature, backward compatible | Minor | 2.1.x -> 2.2.0 |
| Bug fix, backward compatible | Patch | 2.1.1 -> 2.1.2 |

### Tagging releases

```bash
git tag -a v2.1.0 -m "Release v2.1.0: add validation rules"
git push origin v2.1.0
```

## Security Auditing

### Check for known vulnerabilities

```bash
# Built into Composer 2.4+
composer audit

# Example output:
# Found 1 security vulnerability advisory affecting 1 package:
# Package: vendor/package
# CVE: CVE-2024-XXXX
# Title: SQL injection in query builder
# Severity: high
```

### CI integration

```yaml
- name: Security audit
  run: composer audit --format=json
```

### Dependency health

```bash
# List outdated packages
composer outdated --direct

# Show why a package is installed
composer why vendor/package

# Show dependency tree
composer show --tree
```

## Package Publishing

### Packagist registration

1. Create a `composer.json` with proper `name` field.
2. Tag a release with semantic version.
3. Submit repository URL to [packagist.org](https://packagist.org).
4. Set up GitHub webhook for auto-updates.

### Package structure

```
my-package/
├── composer.json
├── LICENSE
├── phpstan.neon.dist
├── phpunit.xml.dist
├── .php-cs-fixer.dist.php
├── .gitignore
├── src/
│   ├── RuleInterface.php
│   ├── Validator.php
│   └── Rules/
│       ├── Required.php
│       └── MinLength.php
└── tests/
    ├── ValidatorTest.php
    └── Rules/
        ├── RequiredTest.php
        └── MinLengthTest.php
```

### .gitignore for packages

```
/vendor/
/.phpunit.cache/
/.phpstan-cache/
/coverage/
composer.lock
.php-cs-fixer.cache
```

## Composer Scripts

### Pre/post hooks

```json
{
    "scripts": {
        "post-install-cmd": [
            "@php artisan clear-compiled"
        ],
        "post-update-cmd": [
            "@php artisan clear-compiled"
        ],
        "test": "phpunit",
        "analyse": "phpstan analyse",
        "cs": "php-cs-fixer fix --dry-run --diff",
        "check": [
            "@cs",
            "@analyse",
            "@test"
        ]
    }
}
```

### Running scripts

```bash
composer run-script test
composer test        # shorthand for well-known scripts
composer check       # runs cs, analyse, test in sequence
```

## Platform Requirements

```json
{
    "require": {
        "php": ">=8.4",
        "ext-json": "*",
        "ext-mbstring": "*",
        "ext-pdo": "*"
    },
    "config": {
        "platform": {
            "php": "8.4.0"
        }
    }
}
```

The `config.platform` setting forces Composer to resolve dependencies as if running the specified PHP version, even if the local PHP is newer. This prevents accidentally requiring features unavailable in production.

## Autoload Optimization

```bash
# Development — fastest dump, includes all classes
composer dump-autoload

# Production — builds classmap for all PSR-4/PSR-0 classes
composer dump-autoload --optimize

# Production with APCu caching (if ext-apcu available)
composer dump-autoload --optimize --apcu
```

In production deployments:
```bash
composer install --no-dev --optimize-autoloader --no-interaction
```
