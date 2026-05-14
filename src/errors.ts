export class CapcayError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CapcayError";
    }
}

export class ProviderError extends CapcayError {
    constructor(
        public provider: string,
        message: string,
        public cause?: unknown
    ) {
        super(`[${provider}] ${message}`);
        this.name = "ProviderError";
    }
}

export class MissingApiKeyError extends CapcayError {
    constructor(provider: string) {
        super(
            `API key for "${provider}" is missing. ` +
            `Pass it via config.apiKey or set the environment variable ` +
            `(GROQ_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY).`
        );
        this.name = "MissingApiKeyError";
    }
}

export class UnsupportedProviderError extends CapcayError {
    constructor(provider: string) {
        super(`Unsupported provider: "${provider}". Valid options: groq, anthropic, openai.`);
        this.name = "UnsupportedProviderError";
    }
}