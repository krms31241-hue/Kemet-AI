import type { Provider } from "./provider.js";

export class ProviderFactory {
  create(
    provider: Provider,
  ): Provider {
    return provider;
  }
}

export const providerFactory =
  new ProviderFactory();

