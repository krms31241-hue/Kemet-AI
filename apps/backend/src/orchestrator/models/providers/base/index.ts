/**
 * index.ts
 *
 * Public surface of the Kemet AI Runtime provider foundation. Concrete
 * providers should only ever import from this barrel rather than reaching
 * into individual files, keeping the internal module layout free to change.
 */

export {
  BaseProvider,
  type ProviderConfig,
  type ProviderRequestOptions,
  type ProviderCapabilities,
} from './base-provider.js';

export {
  HttpClient,
  type HttpClientConfig,
  type HttpMethod,
  type HttpHeaders,
  type QueryValue,
  type ResponseParseMode,
  type HttpRequestOptions,
  type HttpResponse,
  type PreparedRequest,
  type RequestInterceptor,
  type ResponseInterceptor,
  type Logger,
  type MetricsRecorder,
  type RequestMetricsSample,
  type AuthProvider,
} from './http-client.js';

export {
  ProviderError,
  ProviderErrorCode,
  ProviderTimeoutSignal,
  normalizeError,
  normalizeHttpErrorResponse,
  type ProviderErrorContext,
  type ProviderErrorOptions,
} from './provider-error.js';

export {
  ExponentialBackoffRetryPolicy,
  NoRetryPolicy,
  delay,
  type RetryPolicy,
  type ExponentialBackoffOptions,
} from './retry-policy.js';

