# 🚀 Open Lovable Integration Plan for PayAid V3

## 📋 Overview

Integrating Open Lovable's AI website builder into PayAid V3, adapted to use your existing AI providers (Groq, Ollama, Hugging Face) instead of OpenAI/Gemini.

---

## 🎯 Integration Strategy

### Phase 1: Core AI Integration ✅ (Already Done)
- ✅ Created `lib/ai/website-builder.ts` with Groq/Ollama/Hugging Face support
- ✅ Implemented fallback chain
- ✅ Component parsing and validation

### Phase 2: API Endpoints (In Progress)
- 🔄 Create `/api/websites/generate` - Generate components from prompts
- ⏳ Create `/api/websites/[id]/pages/[pageId]/generate` - Generate page content
- ⏳ Create `/api/websites/[id]/pages/[pageId]/update` - Update page with generated code

### Phase 3: Frontend Builder UI
- ⏳ Create `/dashboard/websites/[id]/builder` - Main builder interface
- ⏳ Component preview pane
- ⏳ Code editor with syntax highlighting
- ⏳ Live preview of generated components
- ⏳ Save/export functionality

### Phase 4: Advanced Features
- ⏳ Template gallery
- ⏳ AI suggestions for improvements
- ⏳ Component library
- ⏳ Mobile preview toggle

---

## 🏗️ Architecture

```
User Input (Natural Language)
    ↓
/dashboard/websites/[id]/builder (Frontend)
    ↓
/api/websites/generate (API)
    ↓
lib/ai/website-builder.ts (AI Service)
    ↓
Groq → Ollama → Hugging Face (Fallback Chain)
    ↓
Generated React Components
    ↓
Save to WebsitePage.contentJson
    ↓
Preview/Render
```

---

## 📁 File Structure

```
app/
├── api/
│   └── websites/
│       ├── generate/
│       │   └── route.ts          # Generate components
│       └── [id]/
│           └── pages/
│               └── [pageId]/
│                   ├── generate/
│                   │   └── route.ts  # Generate page content
│                   └── update/
│                       └── route.ts  # Update page
│
├── dashboard/
│   └── websites/
│       └── [id]/
│           └── builder/
│               └── page.tsx      # Main builder UI
│
lib/
├── ai/
│   └── website-builder.ts        # ✅ Already created
└── components/
    └── website-builder/
        ├── PromptInput.tsx       # Natural language input
        ├── ComponentPreview.tsx  # Preview generated components
        ├── CodeEditor.tsx        # Code editor
        └── ComponentLibrary.tsx  # Component library
```

---

## 🔧 Implementation Steps

### Step 1: Create API Endpoint ✅ (Next)

**File:** `app/api/websites/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { generateWebsiteComponents } from '@/lib/ai/website-builder'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    
    const result = await generateWebsiteComponents({
      prompt: body.prompt,
      style: body.style,
      components: body.components,
      framework: 'nextjs',
    })
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Website generation error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate website',
        components: [],
        provider: 'none',
      },
      { status: 500 }
    )
  }
}
```

### Step 2: Create Builder Page

**File:** `app/dashboard/websites/[id]/builder/page.tsx`

Features:
- Natural language prompt input
- Real-time component generation
- Live preview
- Code editor
- Save to database

### Step 3: Integrate with Database

Update `WebsitePage.contentJson` with generated components:
```typescript
{
  "blocks": [
    {
      "id": "hero-1",
      "type": "hero",
      "component": "HeroSection",
      "code": "...",
      "props": {}
    }
  ]
}
```

---

## 🎨 UI Components Needed

### 1. PromptInput Component
- Textarea for natural language input
- Style selector (modern, classic, minimal, etc.)
- Component checklist (hero, features, pricing, etc.)
- Generate button

### 2. ComponentPreview Component
- Live preview of generated components
- Responsive view (desktop/tablet/mobile)
- Interactive elements

### 3. CodeEditor Component
- Syntax highlighting
- Line numbers
- Copy button
- Format button

### 4. ComponentLibrary Component
- List of generated components
- Add/remove components
- Reorder components

---

## 🔄 Open Lovable Features to Adapt

### Core Features:
1. ✅ **Natural Language to Code** - Already implemented
2. ⏳ **Component Preview** - Need to build
3. ⏳ **Code Editor** - Need to build
4. ⏳ **Export Functionality** - Need to build
5. ⏳ **Template System** - Future enhancement

### Advanced Features (Future):
- Website cloning (URL to React)
- AI-powered improvements
- Component suggestions
- Design system integration

---

## 🚀 Quick Start Implementation

1. **Create API endpoint** ✅ (Next step)
2. **Create builder page** with basic UI
3. **Test generation** with your AI providers
4. **Add preview** functionality
5. **Integrate with database** (save to WebsitePage)
6. **Add export** functionality

---

## 📝 Next Steps

1. ✅ Create `/api/websites/generate` endpoint
2. ✅ Create `/dashboard/websites/[id]/builder` page
3. ✅ Test with Groq/Ollama/Hugging Face
4. ✅ Add component preview
5. ✅ Save to database
6. ✅ Add export functionality

---

## 💡 Tips

- Start simple: Basic prompt → component generation
- Test each AI provider separately
- Add features incrementally
- Use your existing UI components (shadcn/ui)
- Follow Open Lovable's UX patterns but adapt to your design system

---

**Ready to start building!** 🚀

