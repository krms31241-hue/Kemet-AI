export class BaseTool {
    async run(input, context) {
        const started = Date.now();
        try {
            const output = await this.execute(input, context);
            return {
                success: true,
                output,
                duration: Date.now() - started,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Unknown error",
                duration: Date.now() - started,
            };
        }
    }
}
