import type { Provider } from "./provider.js";

export class ProviderRegistry {
  private readonly providers =
    new Map<string, Provider>();

  register(
    provider: Provider,
  ): void {
    this.providers.set(
      provider.id,
      provider,
    );
  }

  unregister(
    id: string,
  ): void {
    this.providers.delete(id);
  }

  get(
    id: string,
  ): Provider | null {
    return (
      this.providers.get(id) ??
      null
    );
  }

  list(): Provider[] {
    return [
      ...this.providers.values(),
    ];
  }
}

export const providerRegistry =
  new ProviderRegistry();
