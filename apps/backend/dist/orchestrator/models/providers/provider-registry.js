export class ProviderRegistry {
    providers = new Map();
    register(provider) {
        this.providers.set(provider.id, provider);
    }
    unregister(id) {
        this.providers.delete(id);
    }
    get(id) {
        return (this.providers.get(id) ??
            null);
    }
    list() {
        return [
            ...this.providers.values(),
        ];
    }
}
export const providerRegistry = new ProviderRegistry();
