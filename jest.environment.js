/**
 * Custom Jest environment that extends jsdom with Web API globals.
 *
 * jest-environment-jsdom does not expose Request, Response, Headers, or fetch.
 * Node 18+ ships these natively on globalThis, so we forward them into the
 * jsdom sandbox so Next.js route handlers (NextRequest / NextResponse) work.
 */
const JSDOMEnvironment = require('jest-environment-jsdom').TestEnvironment

class NextJSTestEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context)

    // Inject Web API globals that Node.js provides but jsdom does not
    const webAPIs = [
      'Request',
      'Response',
      'Headers',
      'ReadableStream',
      'WritableStream',
      'TransformStream',
      'fetch',
      'FormData',
      'Blob',
      'File',
      'TextEncoder',
      'TextDecoder',
      'URL',
      'URLSearchParams',
      'AbortController',
      'AbortSignal',
      'structuredClone',
    ]

    for (const api of webAPIs) {
      if (typeof globalThis[api] !== 'undefined' && typeof this.global[api] === 'undefined') {
        this.global[api] = globalThis[api]
      }
    }
  }
}

module.exports = NextJSTestEnvironment
