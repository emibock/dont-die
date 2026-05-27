import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import type { AxeMatchers } from 'vitest-axe/matchers'

declare module 'vitest' {
  interface Assertion<T = any> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers {}
}

declare module 'vitest' {
  interface Assertion extends AxeMatchers {}
}
