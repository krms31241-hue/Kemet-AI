export class ProviderFactory {
    create(provider) {
        return provider;
    }
}
export const providerFactory = new ProviderFactory();
