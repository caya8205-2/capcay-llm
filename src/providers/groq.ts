import Groq from "groq-sdk";
import type { ILLMClient, LLMConfig, LLMMessage, LLMResponse } from "../types.js";
import { MissingApiKeyError, ProviderError } from "../errors.js";

export class GroqClient implements ILLMClient {
    private client: Groq;
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        const apiKey = config.apiKey ?? process.env.GROQ_API_KEY;
        if (!apiKey) throw new MissingApiKeyError("groq");
        this.config = config;
        this.client = new Groq({ apiKey });
    }

    async chat(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
        const start = Date.now();
        const cfg = { ...this.config, ...options };

        try {
            const res = await this.client.chat.completions.create({
                model: cfg.model,
                messages,
                temperature: cfg.temperature ?? 1,
                max_completion_tokens: cfg.maxTokens ?? 1024,
                top_p: cfg.topP ?? 1,
                stream: false,
                stop: cfg.stop ?? null,
            });

            return {
                id: res.id ?? crypto.randomUUID(),
                provider: "groq",
                model: res.model ?? cfg.model,
                message: { role: "assistant", content: res.choices[0].message.content ?? "" },
                usage: {
                    promptTokens: res.usage?.prompt_tokens ?? 0,
                    completionTokens: res.usage?.completion_tokens ?? 0,
                    totalTokens: res.usage?.total_tokens ?? 0,
                },
                latencyMs: Date.now() - start,
            };
        } catch (err) {
            throw new ProviderError("groq", (err as Error).message, err);
        }
    }

    async *stream(messages: LLMMessage[], options?: Partial<LLMConfig>): AsyncGenerator<string> {
        const cfg = { ...this.config, ...options };

        try {
            const stream = await this.client.chat.completions.create({
                model: cfg.model,
                messages,
                temperature: cfg.temperature ?? 1,
                max_completion_tokens: cfg.maxTokens ?? 1024,
                top_p: cfg.topP ?? 1,
                stream: true,
                stop: cfg.stop ?? null,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) yield content;
            }
        } catch (err) {
            throw new ProviderError("groq", (err as Error).message, err);
        }
    }
}