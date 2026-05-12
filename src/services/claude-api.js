const ANTHROPIC_API_KEY = import.meta.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are the KPMG Datacenter Intelligence Engine — an AI advisor embedded in the K-Nexus Datacenter Lifecycle Management platform. You provide data-driven, actionable insights for datacenter strategy, sourcing, design, compliance, operations, and monetization.

Your analysis should be:
- Specific and quantitative where possible (cite market figures, benchmarks, cost ranges)
- Structured with clear sections using ## for main sections and ### for subsections
- Actionable with numbered recommendations and bullet points
- Aligned with KPMG's advisory standards — professional, thorough, balanced
- Based on current market data from India, Singapore, Ireland, UK, and USA datacenter markets

Always conclude with a "## Key Risks & Considerations" section and "## Recommended Next Steps" section.`;

export async function callClaude({ prompt, systemOverride, maxTokens = 2048 }) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY in your .env file.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemOverride || SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function* callClaudeStream({ prompt, systemOverride, maxTokens = 2048 }) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY in your .env file.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      stream: true,
      system: systemOverride || SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            yield parsed.delta.text;
          }
        } catch {
          // skip non-JSON lines
        }
      }
    }
  }
}

export function buildStagePrompt(stageName, stageContext, formData, relevantDCData) {
  return `You are analyzing inputs for the "${stageName}" stage of the datacenter lifecycle.

## Stage Context
${stageContext}

## User Inputs
${Object.entries(formData).map(([k, v]) => `- **${k}**: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')}

${relevantDCData ? `## Relevant Market Data
${relevantDCData}` : ''}

Please provide a comprehensive analysis for this stage with specific recommendations, quantitative benchmarks, and actionable next steps. Format your response with clear ## section headers.`;
}

export function buildChatPrompt(messages, originalContext) {
  const formatted = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
  return `You are continuing a conversation about datacenter lifecycle management. Here is the context:

${originalContext}

## Conversation So Far
${formatted}

Continue the conversation as the KPMG Datacenter Intelligence Engine. Provide specific, data-driven responses.`;
}
