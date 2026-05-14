# capcay-llm

Client LLM ringan untuk Node.js dengan satu interface yang mendukung Groq, Anthropic, dan OpenAI.

## Instalasi

```bash
npm install capcay-llm
# atau
pnpm add capcay-llm
```

## Penggunaan

### Basic

```ts
import { createLLMClient } from "capcay-llm";

const client = createLLMClient({
  provider: "groq",
  model: "llama-3.3-70b-versatile",
});

const response = await client.chat([
  { role: "user", content: "Halo!" }
]);

console.log(response.message.content);
```

### System Prompt

```ts
const response = await client.chat([
  { role: "system", content: "Kamu adalah asisten yang membantu." },
  { role: "user", content: "Siapa kamu?" }
]);
```

### Streaming

```ts
for await (const chunk of client.stream([
  { role: "user", content: "Ceritakan tentang Node.js" }
])) {
  process.stdout.write(chunk);
}
```

### Ganti Provider

Interface-nya identik di semua provider — tinggal ganti config:

```ts
// Groq
const client = createLLMClient({ provider: "groq", model: "llama-3.3-70b-versatile" });

// Anthropic
const client = createLLMClient({ provider: "anthropic", model: "claude-sonnet-4-20250514" });

// OpenAI
const client = createLLMClient({ provider: "openai", model: "gpt-4o" });
```

### Default Client dari ENV

```ts
import { createDefaultClient } from "capcay-llm";

// baca dari LLM_DEFAULT_PROVIDER dan LLM_DEFAULT_MODEL
const client = createDefaultClient();
```

### Konfigurasi Lengkap

```ts
const client = createLLMClient({
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  apiKey: "your-api-key",   // opsional, bisa dari env
  temperature: 0.8,
  maxTokens: 2048,
  topP: 1,
  stop: null,
});
```

## Environment Variables

```env
GROQ_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# untuk createDefaultClient()
LLM_DEFAULT_PROVIDER=groq
LLM_DEFAULT_MODEL=llama-3.3-70b-versatile
```

## Provider yang Didukung

| Provider | Keterangan |
|---|---|
| `groq` | Groq Cloud — cepat dan gratis |
| `anthropic` | Anthropic Claude |
| `openai` | OpenAI GPT |

## Error Handling

```ts
import { ProviderError, MissingApiKeyError } from "capcay-llm";

try {
  const response = await client.chat([...]);
} catch (err) {
  if (err instanceof MissingApiKeyError) {
    console.error("API key tidak ditemukan");
  } else if (err instanceof ProviderError) {
    console.error(`Error dari ${err.provider}:`, err.message);
  }
}
```

## Lisensi

MIT