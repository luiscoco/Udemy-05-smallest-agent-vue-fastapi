import { TextEncoder, TextDecoder } from 'node:util';
import { ReadableStream } from 'node:stream/web';
Object.assign(globalThis, { TextEncoder, TextDecoder, ReadableStream });
