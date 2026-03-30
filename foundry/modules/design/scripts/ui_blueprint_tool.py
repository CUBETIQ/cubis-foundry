#!/usr/bin/env python3
"""Create deterministic audits, adaptive matrices, and prompt packs from a UI design brief."""

import argparse
import json
import sys
from pathlib import Path


GENERAL_REQUIRED = [
    'product_name',
    'product_type',
    'platforms',
    'goals',
    'users',
    'screens',
]

GENERAL_RECOMMENDED = [
    'jobs_to_be_done',
    'brand_adjectives',
    'constraints',
    'platform_details',
    'design_direction',
]

PLATFORM_REQUIRED = {
    'mobile': [
        ('platform_details.mobile.targets', 'mobile targets'),
        ('platform_details.mobile.primary_navigation', 'mobile primary navigation'),
    ],
    'web': [
        ('platform_details.web.targets', 'web targets'),
        ('platform_details.web.primary_navigation', 'web primary navigation'),
    ],
    'desktop': [
        ('platform_details.desktop.targets', 'desktop targets'),
        ('platform_details.desktop.primary_navigation', 'desktop primary navigation'),
    ],
}

DEFAULT_MATRIX = {
    'mobile': [
        {
            'size_class': 'phone compact',
            'width': '320 to 375',
            'columns': '4',
            'density': 'comfortable',
            'input_bias': 'touch',
            'notes': 'single-column flow and highly visible primary action',
        },
        {
            'size_class': 'phone regular',
            'width': '390 to 430',
            'columns': '4',
            'density': 'comfortable',
            'input_bias': 'touch',
            'notes': 'allow richer cards or two-up metrics only when secondary',
        },
        {
            'size_class': 'tablet',
            'width': '768 to 1024',
            'columns': '8',
            'density': 'balanced',
            'input_bias': 'touch plus keyboard',
            'notes': 'introduce sidebar, split view, or persistent secondary pane',
        },
    ],
    'web': [
        {
            'size_class': 'small',
            'width': '360 to 767',
            'columns': '4',
            'density': 'comfortable',
            'input_bias': 'touch plus keyboard',
            'notes': 'stack panels and rethink tables instead of crushing columns',
        },
        {
            'size_class': 'medium',
            'width': '768 to 1023',
            'columns': '8',
            'density': 'balanced',
            'input_bias': 'touch plus keyboard',
            'notes': 'use rail or tabbed sections, convert secondary content into drawers or tabs',
        },
        {
            'size_class': 'large',
            'width': '1024 to 1439',
            'columns': '12',
            'density': 'balanced',
            'input_bias': 'pointer plus keyboard',
            'notes': 'support two or three region layouts with persistent context',
        },
        {
            'size_class': 'wide',
            'width': '1440 and up',
            'columns': '12',
            'density': 'balanced to dense',
            'input_bias': 'pointer plus keyboard',
            'notes': 'use max widths or add a utility pane instead of uncontrolled stretch',
        },
    ],
    'desktop': [
        {
            'size_class': 'compact',
            'width': '1024 to 1279',
            'columns': '12',
            'density': 'balanced',
            'input_bias': 'pointer plus keyboard',
            'notes': 'support two-pane workspaces and compact command surfaces',
        },
        {
            'size_class': 'regular',
            'width': '1280 to 1535',
            'columns': '12',
            'density': 'dense',
            'input_bias': 'pointer plus keyboard',
            'notes': 'enable sidebar plus content plus inspector when useful',
        },
        {
            'size_class': 'expanded',
            'width': '1536 and up',
            'columns': '12',
            'density': 'dense',
            'input_bias': 'pointer plus keyboard',
            'notes': 'persistent inspectors, comparison panes, and dense data views fit naturally',
        },
    ],
}


def load_json(path):
    path = Path(path)
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except FileNotFoundError:
        raise SystemExit(f'Input file not found: {path}')
    except json.JSONDecodeError as exc:
        raise SystemExit(f'Invalid JSON in {path}: {exc}')


def get_value(data, dotted_path):
    current = data
    for part in dotted_path.split('.'):
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


def is_empty(value):
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ''
    if isinstance(value, (list, dict, tuple, set)):
        return len(value) == 0
    return False


def listify(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def audit_brief(brief):
    missing_required = []
    missing_recommended = []
    warnings = []
    strengths = []

    for field in GENERAL_REQUIRED:
        if is_empty(brief.get(field)):
            missing_required.append(field)

    for field in GENERAL_RECOMMENDED:
        if is_empty(brief.get(field)):
            missing_recommended.append(field)

    platforms = [str(p).strip().lower() for p in listify(brief.get('platforms')) if str(p).strip()]
    if not platforms:
        warnings.append('No platforms were provided, so the audit cannot pick mobile, web, or desktop rules.')

    for platform in platforms:
        for dotted, label in PLATFORM_REQUIRED.get(platform, []):
            if is_empty(get_value(brief, dotted)):
                missing_required.append(label)

    screens = listify(brief.get('screens'))
    if screens:
        strengths.append(f"{len(screens)} screen definitions provided")
    else:
        warnings.append('No screens were defined. Screen inventory is usually necessary for a useful blueprint.')

    constraints = brief.get('constraints', {}) if isinstance(brief.get('constraints'), dict) else {}
    if not is_empty(constraints.get('accessibility_target')):
        strengths.append(f"Accessibility target set to {constraints.get('accessibility_target')}")
    else:
        warnings.append('Accessibility target is missing. Add a target such as wcag 2.2 aa.')

    if 'mobile' in platforms:
        mobile = get_value(brief, 'platform_details.mobile') or {}
        if is_empty(mobile.get('one_handed_use')):
            warnings.append('Mobile brief does not say whether one-handed use matters.')
        if constraints.get('offline_support'):
            strengths.append('Mobile flow considers offline support')
        else:
            warnings.append('Mobile products often need explicit offline or poor-network behavior.')

    if 'web' in platforms:
        web = get_value(brief, 'platform_details.web') or {}
        breakpoints = web.get('breakpoints')
        if is_empty(breakpoints):
            warnings.append('Web brief does not list content breakpoints or size classes.')
        else:
            strengths.append(f"Web breakpoints provided: {', '.join(str(x) for x in breakpoints)}")
        if is_empty(constraints.get('browser_support')):
            warnings.append('Web brief does not list browser support expectations.')

    if 'desktop' in platforms:
        desktop = get_value(brief, 'platform_details.desktop') or {}
        if desktop.get('keyboard_shortcuts') is True:
            strengths.append('Desktop brief accounts for keyboard shortcuts')
        else:
            warnings.append('Desktop brief should say whether keyboard shortcuts are required.')
        if is_empty(constraints.get('desktop_os')):
            warnings.append('Desktop brief does not list target operating systems.')

    design_direction = brief.get('design_direction', {}) if isinstance(brief.get('design_direction'), dict) else {}
    if is_empty(design_direction.get('style_family')):
        warnings.append('Design direction does not define a style family.')
    else:
        strengths.append(f"Style family set to {design_direction.get('style_family')}")

    lines = []
    lines.append('# UI Brief Audit')
    lines.append('')
    lines.append(f"- Product: {brief.get('product_name', '(missing)')}")
    lines.append(f"- Product type: {brief.get('product_type', '(missing)')}")
    lines.append(f"- Platforms: {', '.join(platforms) if platforms else '(missing)'}")
    lines.append('')

    lines.append('## Missing required items')
    if missing_required:
        for item in sorted(dict.fromkeys(missing_required)):
            lines.append(f'- {item}')
    else:
        lines.append('- none')
    lines.append('')

    lines.append('## Missing recommended items')
    if missing_recommended:
        for item in sorted(dict.fromkeys(missing_recommended)):
            lines.append(f'- {item}')
    else:
        lines.append('- none')
    lines.append('')

    lines.append('## Strengths')
    if strengths:
        for item in strengths:
            lines.append(f'- {item}')
    else:
        lines.append('- none yet')
    lines.append('')

    lines.append('## Warnings')
    if warnings:
        for item in warnings:
            lines.append(f'- {item}')
    else:
        lines.append('- none')
    lines.append('')

    lines.append('## Recommended next steps')
    next_steps = []
    if missing_required:
        next_steps.append('Fill the missing required items first.')
    if warnings:
        next_steps.append('Address the warnings that are most likely to change the layout or interaction model.')
    next_steps.append('Use the matrix command to generate adaptive size classes after the brief is complete.')
    next_steps.append('Use the prompts command to create reusable prompts for other agents or design tools.')
    for item in next_steps:
        lines.append(f'- {item}')
    return '\n'.join(lines)


def navigation_for_platform(brief, platform):
    detail = get_value(brief, f'platform_details.{platform}') or {}
    nav = detail.get('primary_navigation')
    if not is_empty(nav):
        return nav
    defaults = {
        'mobile': 'bottom tabs or stack',
        'web': 'header plus rail',
        'desktop': 'sidebar plus multi-pane',
    }
    return defaults.get(platform, 'tbd')


def matrix_rows(brief):
    platforms = [str(p).strip().lower() for p in listify(brief.get('platforms')) if str(p).strip()]
    rows = []
    for platform in platforms:
        for item in DEFAULT_MATRIX.get(platform, []):
            rows.append({
                'surface': platform,
                'size_class': item['size_class'],
                'width': item['width'],
                'columns': item['columns'],
                'density': item['density'],
                'navigation': navigation_for_platform(brief, platform),
                'input_bias': item['input_bias'],
                'notes': item['notes'],
            })
    return rows


def markdown_table(headers, rows):
    header_line = '| ' + ' | '.join(headers) + ' |'
    divider = '| ' + ' | '.join(['---'] * len(headers)) + ' |'
    body = []
    for row in rows:
        body.append('| ' + ' | '.join(str(row.get(h, '')) for h in headers) + ' |')
    return '\n'.join([header_line, divider] + body)


def matrix_output(brief):
    rows = matrix_rows(brief)
    lines = ['# Adaptive Layout Matrix', '']
    lines.append(f"- Product: {brief.get('product_name', '(missing)')}")
    lines.append(f"- Platforms: {', '.join(listify(brief.get('platforms'))) or '(missing)'}")
    lines.append('')
    table_rows = []
    for row in rows:
        table_rows.append({
            'Surface': row['surface'],
            'Size class': row['size_class'],
            'Width': row['width'],
            'Columns': row['columns'],
            'Density': row['density'],
            'Navigation': row['navigation'],
            'Input bias': row['input_bias'],
            'Notes': row['notes'],
        })
    lines.append(markdown_table(
        ['Surface', 'Size class', 'Width', 'Columns', 'Density', 'Navigation', 'Input bias', 'Notes'],
        table_rows,
    ))
    lines.append('')
    lines.append('## Notes')
    lines.append('- Treat this table as a starting point, then adapt it to content and task changes.')
    lines.append('- Larger surfaces should gain context and speed, not only larger cards.')
    lines.append('- Keep shared tokens aligned, but allow surface-specific composition and behavior.')
    return '\n'.join(lines)


def prompts_output(brief):
    platforms = [str(p).strip().lower() for p in listify(brief.get('platforms')) if str(p).strip()]
    screens = [s.get('name', 'unnamed screen') for s in listify(brief.get('screens')) if isinstance(s, dict)]
    goals = '; '.join(listify(brief.get('goals')))
    users = ', '.join(listify(brief.get('users')))
    brand = ', '.join(listify(brief.get('brand_adjectives')))
    direction = brief.get('design_direction', {}) if isinstance(brief.get('design_direction'), dict) else {}
    style_family = direction.get('style_family', 'unspecified')
    density = direction.get('density', 'balanced')
    motion_style = direction.get('motion_style', 'subtle')

    lines = ['# Prompt Pack', '']
    lines.append('## Shared system prompt')
    shared = [
        f"Design a cross-platform UI system for {brief.get('product_name', 'the product')}, a {brief.get('product_type', 'product')}.",
        f"Primary users: {users or 'unspecified users'}.",
        f"Goals: {goals or 'unspecified goals'}.",
        f"Platforms: {', '.join(platforms) if platforms else 'unspecified'}.",
        f"Design direction: {style_family}; density: {density}; motion: {motion_style}; brand adjectives: {brand or 'unspecified'}.",
        f"Cover these screens or views: {', '.join(screens) if screens else 'unspecified screens'}.",
        'Keep semantic tokens and product language shared, but adapt layout, navigation, density, and interaction model by surface.',
        'Include empty, loading, error, success, disabled, and permission states.',
        'Call out responsive behavior within surfaces and adaptive behavior across surfaces.',
        'Avoid generic AI-slop patterns such as over-carding, weak hierarchy, decorative gradients, and copied mobile layouts on desktop.',
    ]
    lines.append('```')
    lines.append(' '.join(shared))
    lines.append('```')
    lines.append('')

    for platform in platforms:
        lines.append(f"## {platform.capitalize()} prompt")
        nav = navigation_for_platform(brief, platform)
        if platform == 'mobile':
            prompt = (
                f"Design the mobile app UI for {brief.get('product_name', 'the product')}. "
                f"Use a {style_family} direction with {density} density and {motion_style} motion. "
                f"Primary navigation: {nav}. Optimize for touch, reduced attention, and fast task completion. "
                f"Cover these screens: {', '.join(screens) if screens else 'unspecified'}. "
                'Use progressive disclosure, obvious back paths, strong feedback, and explicit offline or sync states when relevant.'
            )
        elif platform == 'web':
            prompt = (
                f"Design the responsive web UI for {brief.get('product_name', 'the product')}. "
                f"Use a {style_family} direction with {density} density and {motion_style} motion. "
                f"Primary navigation: {nav}. Support keyboard and pointer first, with touch-friendly fallbacks. "
                f"Cover these screens: {', '.join(screens) if screens else 'unspecified'}. "
                'Use content-driven breakpoints, semantic structure, and intentional table or filter behavior at smaller widths.'
            )
        else:
            prompt = (
                f"Design the desktop app UI for {brief.get('product_name', 'the product')}. "
                f"Use a {style_family} direction with {density} density and {motion_style} motion. "
                f"Primary navigation: {nav}. Optimize for keyboard, pointer precision, multi-step workflows, and persistent context. "
                f"Cover these screens: {', '.join(screens) if screens else 'unspecified'}. "
                'Use panes, inspectors, tables, saved views, and shortcuts where they reduce interaction cost.'
            )
        lines.append('```')
        lines.append(prompt)
        lines.append('```')
        lines.append('')

    lines.append('## Delivery checklist')
    lines.append('- State the design direction clearly.')
    lines.append('- Explain the navigation model for each surface.')
    lines.append('- List the key screens and states.')
    lines.append('- Describe responsive and adaptive behavior explicitly.')
    lines.append('- Include accessibility and motion notes.')
    return '\n'.join(lines)


def build_parser():
    parser = argparse.ArgumentParser(
        description='Create deterministic UI design outputs from a JSON brief.'
    )
    parser.add_argument(
        'command',
        choices=['audit', 'matrix', 'prompts'],
        help='Output type to generate.',
    )
    parser.add_argument(
        'input',
        help='Path to a JSON brief.',
    )
    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    brief = load_json(args.input)

    if args.command == 'audit':
        print(audit_brief(brief))
    elif args.command == 'matrix':
        print(matrix_output(brief))
    elif args.command == 'prompts':
        print(prompts_output(brief))
    else:
        raise SystemExit(f'Unknown command: {args.command}')


if __name__ == '__main__':
    main(sys.argv[1:])
