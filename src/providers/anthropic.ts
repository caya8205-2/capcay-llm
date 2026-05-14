import Anthropic from "@anthropic-ai/sdk";
import type { ILLMClient, LLMConfig, LLMMessage, LLMResponse } from "../types.js";
import { MissingApiKeyError, ProviderError } from "../errors.js";

type AnthropicMessage = { role: "user" | "assistant"; content: string };

function toAnthropicMessages(messages: LLMMessage[]): AnthropicMessage[] {
    return messages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
}

export class AnthropicClient implements ILLMClient {
    private client: Anthropic;
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new MissingApiKeyError("anthropic");
        this.config = config;
        this.client = new Anthropic({ apiKey });
    }

    async chat(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
        const start = Date.now();
        const cfg = { ...this.config, ...options };
        const systemMsg = messages.find(m => m.role === "system")?.content;

        try {
            const res = await this.client.messages.create({
                model: cfg.model,
                max_tokens: cfg.maxTokens ?? 1024,
                temperature: cfg.temperature ?? 1,
                top_p: cfg.topP ?? 1,
                ...(systemMsg && { system: systemMsg }),
                messages: toAnthropicMessages(messages),
            });

            const block = res.content[0];
            return {
                id: res.id,
                provider: "anthropic",
                model: res.model,
                message: { role: "assistant", content: block.type === "text" ? block.text : "" },
                usage: {
                    promptTokens: res.usage.input_tokens,
                    completionTokens: res.usage.output_tokens,
                    totalTokens: res.usage.input_tokens + res.usage.output_tokens,
                },
                latencyMs: Date.now() - start,
            };
        } catch (err) {
            throw new ProviderError("anthropic", (err as Error).message, err);
        }
    }

    async *stream(messages: LLMMessage[], options?: Partial<LLMConfig>): AsyncGenerator<string> {
        const cfg = { ...this.config, ...options };
        const systemMsg = messages.find(m => m.role === "system")?.content;

        try {
            const stream = await this.client.messages.stream({
                model: cfg.model,
                max_tokens: cfg.maxTokens ?? 1024,
                ...(systemMsg && { system: systemMsg }),
                messages: toAnthropicMessages(messages),
            });

            for await (const chunk of stream) {
                if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                    yield chunk.delta.text;
                }
            }
        } catch (err) {
            throw new ProviderError("anthropic", (err as Error).message, err);
        }
    }
}