import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { Result } from 'axe-core';

/**
 * Filters axe violation results to only critical and serious impact levels.
 * Moderate and minor violations are informational only and do not fail the test.
 * @param violations - The full violations array from AxeBuilder.analyze().
 * @returns Violations with impact 'critical' or 'serious'.
 */
export function getCriticalViolations(violations: Result[]): Result[] {
  return violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
}

/**
 * Returns an AxeBuilder configured with WCAG 2.1 AA tags and DemoQA-specific
 * exclusions for known vendor-side accessibility issues:
 *   - `header` — logo `<img>` without alt text; wrapping `<a>` without accessible text.
 *   - `.left-pannel` — sidebar nav toggle button without aria-label or visible text.
 *   - `.btn-outline-secondary` — search icon buttons that contain only SVG with no label.
 *   - `color-contrast` rule — DemoQA's colour scheme does not meet AA contrast ratios;
 *     this is a vendor styling issue outside the scope of this test suite.
 *   - `aria-command-name` rule — DemoQA renders unnamed ARIA link widgets in the
 *     left-panel accordion; vendor-side issue unrelated to application content.
 *   - `iframe[id^="google_ads_iframe_"]` — Google Ads iframes injected by DemoQA;
 *     they contain `aria-hidden` violations and unnamed links that are vendor/ad issues.
 * @param page - The Playwright Page instance to attach the builder to.
 * @returns A pre-configured AxeBuilder ready for `.analyze()`.
 */
export function buildAxe(page: Page): AxeBuilder {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('header')
    .exclude('.left-pannel')
    .exclude('.btn-outline-secondary')
    .exclude('iframe[id^="google_ads_iframe_"]')
    .disableRules([
      'color-contrast',    // DemoQA colour scheme doesn't meet AA contrast ratios (vendor)
      'aria-command-name', // DemoQA renders unnamed ARIA links in its left-panel widgets (vendor)
    ]);
}
