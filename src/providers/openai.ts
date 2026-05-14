import OpenAI from "openai";
import type { ILLMClient, LLMConfig, LLMMessage, LLMResponse } from "../types.js";
import { MissingApiKeyError, ProviderError } from "../errors.js";

export class OpenAIClient implements ILLMClient {
    private client: OpenAI;
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
        if (!apiKey) throw new MissingApiKeyError("openai");
        this.config = config;
        this.client = new OpenAI({ apiKey });
    }

    async chat(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
        const start = Date.now();
        const cfg = { ...this.config, ...options };

        try {
            const res = await this.client.chat.completions.create({
                model: cfg.model,
                messages,
                temperature: cfg.temperature ?? 1,
                max_tokens: cfg.maxTokens ?? 1024,
                top_p: cfg.topP ?? 1,
                stop: cfg.stop ?? null,
                stream: false,
            });

            return {
                id: res.id,
                provider: "openai",
                model: res.model,
                message: { role: "assistant", content: res.choices[0].message.content ?? "" },
                usage: {
                    promptTokens: res.usage?.prompt_tokens ?? 0,
                    completionTokens: res.usage?.completion_tokens ?? 0,
                    totalTokens: res.usage?.total_tokens ?? 0,
                },
                latencyMs: Date.now() - start,
            };
        } catch (err) {
            throw new ProviderError("openai", (err as Error).message, err);
        }
    }

    async *stream(messages: LLMMessage[], options?: Partial<LLMConfig>): AsyncGenerator<string> {
        const cfg = { ...this.config, ...options };

        try {
            const stream = await this.client.chat.completions.create({
                model: cfg.model,
                messages,
                temperature: cfg.temperature ?? 1,
                max_tokens: cfg.maxTokens ?? 1024,
                top_p: cfg.topP ?? 1,
                stop: cfg.stop ?? null,
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) yield content;
            }
        } catch (err) {
            throw new ProviderError("openai", (err as Error).message, err);
        }
    }
}