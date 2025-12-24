# AI Clarifying Questions Feature ✅

## Overview

The AI system now proactively asks clarifying questions when user prompts lack sufficient context, instead of providing generic responses. This ensures more accurate and helpful AI interactions across all features.

## How It Works

### 1. Context Analysis
When a user submits a prompt, the system analyzes:
- What information is needed to answer accurately
- What context is available from the business data
- What critical information is missing

### 2. Smart Questioning
If critical information is missing, the AI:
- Asks **ONE specific clarifying question** (not multiple)
- Provides **suggested questions** that users can click to answer
- Avoids generic responses by gathering needed context first

### 3. Context-Aware Responses
Once enough context is gathered:
- AI provides accurate, data-driven responses
- Uses actual business data instead of generic answers
- Creates documents/content with real information

## Implementation

### Files Created/Modified

1. **`lib/ai/context-analyzer.ts`** (NEW)
   - `analyzePromptContext()` - Analyzes if enough context exists
   - `formatClarifyingQuestions()` - Formats questions for display
   - Detects missing context for different request types

2. **`app/api/ai/chat/route.ts`** (MODIFIED)
   - Integrated context analysis
   - Asks clarifying questions when context is low
   - Enhanced system prompt to ask questions when needed

3. **`app/api/ai/generate-image/route.ts`** (MODIFIED)
   - Validates prompt detail before generation
   - Suggests improvements for vague prompts
   - Provides example prompts

4. **`app/api/ai/generate-post/route.ts`** (MODIFIED)
   - Validates topic detail
   - Asks for clarification if topic is too vague

5. **`app/dashboard/ai/page.tsx`** (MODIFIED)
   - Displays clarifying questions with clickable buttons
   - Shows suggested questions in a user-friendly format

6. **`app/dashboard/marketing/social/create-image/page.tsx`** (MODIFIED)
   - Validates prompt length and detail
   - Shows helpful error messages with examples

## Examples

### Example 1: Vague Proposal Request

**User:** "Create a proposal"

**AI Response:**
```
To give you the most accurate response, I need a bit more information:

1. Which client or company is this proposal for?
2. What is the deal value and what stage is it in?
3. What products or services should be included in this proposal?

Please provide these details so I can help you better!
```

**User clicks:** "Which client or company is this proposal for?"

**User:** "Acme Corporation"

**AI Response:** *Creates detailed proposal using Acme's information from CRM*

### Example 2: Vague Social Media Post

**User:** "Create a post"

**AI Response:**
```
To create an engaging post, I need more details about the topic.

1. What is the main message or theme of this post?
2. What should readers learn or take away?
3. Is this about a product, company update, industry insight, or something else?
```

### Example 3: Vague Image Prompt

**User:** "Generate image: office"

**AI Response:**
```
To generate a better image, please provide more specific details.

Example: Instead of "office", try "A modern business professional working 
on a laptop in a bright, contemporary office with large windows and natural lighting"
```

## Context Detection

The system detects missing context for:

- **Proposals**: Client info, deal details, products/services
- **Social Media Posts**: Topic, platform, message
- **Image Generation**: Subject, style, details
- **Pitch Decks**: Business information, key points
- **Business Plans**: Business aspects to cover
- **Tasks**: Specific task information
- **Invoices**: Which invoice
- **Deals**: Which deal

## User Experience

### In AI Chat:
- Clarifying questions appear in a highlighted box
- Suggested questions are clickable buttons
- Users can click to quickly answer
- Conversation flows naturally

### In Image Generation:
- Validation happens before API call
- Helpful error messages with examples
- Prevents wasted API calls

### In Post Generation:
- Topic validation
- Clear guidance on what's needed
- Better post quality

## Benefits

✅ **More Accurate**: AI gets needed context before responding  
✅ **Less Generic**: No more "go to the page" responses  
✅ **User-Friendly**: Clickable suggested questions  
✅ **Efficient**: One question at a time, not overwhelming  
✅ **Better Results**: More context = better AI output  

## Configuration

No additional configuration needed! The feature uses:
- Existing business data context
- AI services (Groq/Ollama) for intelligent questioning
- Context analysis logic

## Status

🎉 **Feature Complete** - Ready to use!

The AI will now proactively ask clarifying questions when prompts lack context, ensuring more accurate and helpful responses across all AI features.
