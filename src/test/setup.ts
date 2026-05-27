import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from 'vitest-axe/matchers'
import * as testingLibraryMatchers from '@testing-library/jest-dom/matchers'
import 'fake-indexeddb/auto'

// Extend Vitest's expect with testing-library and vitest-axe matchers
expect.extend(matchers)
expect.extend(testingLibraryMatchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})
