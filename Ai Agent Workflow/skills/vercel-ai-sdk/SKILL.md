---
name: vercel-ai-sdk
description: "Vercel AI SDK for building AI-powered applications: core providers/streaming patterns and React/Svelte UI hooks for chat, completion, and generative UX."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, ai sdk, useChat, useCompletion, streamText, generateText, ai ui, streaming, generative ui
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: react-expert, nextjs-developer, prompt-engineer, vercel-ai-gateway
  consolidates: vercel-ai-sdk-core, vercel-ai-sdk-ui
---

# Vercel AI SDK

## Purpose

Build AI-powered applications with Vercel AI SDK covering core provider integration, streaming primitives, and framework UI hooks for chat, completion, and generative interfaces.

## When To Use

- Integrating LLM providers (OpenAI, Anthropic, Google, etc.) via unified SDK.
- Streaming text, objects, or tool calls from the server to the client.
- Building chat or completion UIs with `useChat` / `useCompletion` hooks.
- Implementing generative UI and multi-step agent flows.

## Domain Areas

### Core (Provider & Streaming)

- Configure providers with `createOpenAI`, `createAnthropic`, etc.
- Use `streamText`, `generateText`, `streamObject`, `generateObject`.
- Handle tool calls, multi-step flows, and error recovery.

### UI Hooks (React / Svelte / Vue)

- `useChat`: managed chat history, streaming, form submission.
- `useCompletion`: single-prompt streaming completions.
- `useAssistant`: OpenAI Assistants API integration.
- Attach metadata, handle events, and control abort signals.

## Operating Checklist

1. Select and configure the appropriate provider.
2. Choose streaming vs. non-streaming based on UX requirements.
3. Implement error handling and loading states in UI hooks.
4. Validate type safety of generated objects with schema validation.
5. Test streaming under latency and partial-response conditions.

## Output Contract

- Provider configuration and env var requirements
- Stream handler and UI hook implementation
- Tool call schemas and multi-step flow definitions
- Error and abort handling patterns
- Validation evidence and rollback notes
