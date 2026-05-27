import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from 'vitest-axe/matchers'

// Extend Vitest's expect with vitest-axe matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})
