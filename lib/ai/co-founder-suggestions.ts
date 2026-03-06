/**
 * AI Co-Founder – Suggested prompt chips by specialist.
 * Keys match AgentId from lib/ai/agents. Used for quick chips under the input bar.
 */

export const CO_FOUNDER_SUGGESTIONS: Record<string, string[]> = {
  cofounder: [
    'What should I focus on today to improve my business?',
    'Summarise the most important things I should act on this week.',
    'Diagnose my sales pipeline — where exactly are deals getting stuck?',
    'Analyse my cash flow for the next 90 days and highlight risks.',
    'Identify customers most likely to churn and why.',
  ],

  finance: [
    'Analyse my cash flow for the next 90 days and highlight risks.',
    'Break down my revenue for the last 3 months by product and customer.',
    'Identify customers who pay late frequently and suggest actions.',
    'How much working capital buffer do I effectively have today?',
    'Which products or services are most profitable, and which are dragging margins?',
  ],

  sales: [
    'List my top 10 at‑risk deals and what to do about each.',
    'Give me a step‑by‑step plan to close deals scheduled this month.',
    'Generate follow‑up messages for my top 20 open deals.',
    'Which reps are performing best and who needs coaching, and why?',
    'Diagnose my sales pipeline — where exactly are deals getting stuck?',
  ],

  marketing: [
    'Which lead sources are giving me the best ROI recently?',
    'Suggest 3 campaigns to generate more high‑quality B2B leads.',
    'Draft an email + WhatsApp campaign to recover inactive customers.',
    'What are my top 5 recommendations to reduce lead leakage?',
    'Looking at my data, which customer segment should I market to more?',
  ],

  website: [
    'Suggest 5 improvements to my landing pages based on visitor data.',
    'Which pages have the highest drop‑off and why?',
    'Review my checkout flow and suggest conversion improvements.',
    'What content should I add to reduce bounce rate?',
    'Generate A/B test ideas for my landing pages.',
  ],

  hr: [
    'Analyse team performance and attendance — who is over‑ or under‑loaded?',
    'Highlight any HR or payroll risks I should know about this month.',
    'Which employees are consistently high performers, and how can I reward them?',
    'Show me employees or teams that need my attention right now.',
    'Recommend how to restructure my sales team based on performance.',
  ],

  restaurant: [
    "Review my restaurant's revenue and suggest a plan to increase table turnover.",
    'What does my data say about peak hours and menu performance?',
    'Suggest a weekend promotion plan based on historical data.',
    'Which menu items should I promote or discontinue?',
    'How can I improve my delivery order margins?',
  ],

  retail: [
    'Analyse stock turns and suggest which SKUs to discontinue or push.',
    "Help me design a festival promotion plan based on last year's data.",
    'Which products have the best margins and how can I sell more?',
    'Identify slow‑moving inventory and suggest clearance strategies.',
    'What pricing adjustments should I make for the next quarter?',
  ],

  manufacturing: [
    'Identify orders or projects at risk of delay and suggest mitigations.',
    'Show me where production bottlenecks might be happening.',
    'Analyse material costs vs output and suggest efficiency improvements.',
    'Which customers are most profitable, and should I prioritise them?',
    'Suggest capacity planning for the next 3 months.',
  ],

  'growth-strategist': [
    'What should I focus on today to improve my business?',
    'Summarise the most important things I should act on this week.',
    'Show me the shortest paths to add ₹10L revenue this quarter.',
    'Which customer segment should I invest in for growth?',
    'Where am I losing deals and how can I fix it?',
  ],

  operations: [
    'Where can I reduce costs without hurting growth?',
    'Identify orders or projects at risk of delay and suggest mitigations.',
    'Show me where production bottlenecks might be happening.',
    'Which processes are wasting the most time?',
    'Suggest capacity planning for the next 3 months.',
  ],

  default: [
    'What should I focus on today to improve my business?',
    'Summarise the most important things I should act on this week.',
    'How healthy is my pipeline?',
    "What's my cash flow situation?",
    'Who are my top customers and how are they doing?',
  ],
}

export function getSuggestionsForAgent(agentId: string): string[] {
  return CO_FOUNDER_SUGGESTIONS[agentId] ?? CO_FOUNDER_SUGGESTIONS.default
}
