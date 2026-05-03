# AI Assistant System Prompt - Quick Reference

## 🎯 What Changed

The AI agent in Yumeo now operates as a **STRICT RESEARCH ASSISTANT** with mandatory citations and evidence-based responses.

---

## ✅ Core Rules (Automatically Enforced)

### 1. **Citation Requirement**
- Every claim MUST end with `(Source: filename, page N)`
- Example: "According to Smith et al., X occurs [Source: paper.pdf, p. 42]"

### 2. **Grounding Enforcement**
- Answer ONLY based on uploaded references
- If information not available → respond: **"I don't have this in your uploaded materials."**

### 3. **No Hallucination**
- No invented authors, dates, or statistics
- No external knowledge (unless explicitly asked for context)
- No claims without source attribution

### 4. **Academic Integrity**
- Exact author names and publication dates from materials
- Specific page numbers included
- No made-up sources or citations

### 5. **Template Compliance**
- If template uploaded → follow its structure EXACTLY
- Match citation style and formatting conventions

### 6. **Academic Style**
- Clear, structured writing
- Evidence-focused (no filler or conjecture)
- Proper use of figures, tables, equations

### 7. **Writing Support**
- Help refine arguments using material-backed evidence
- Suggest structure if template exists
- Ask permission before incorporating sources

---

## 📍 Where It's Active

**All AI requests** go through the enhanced system prompt:
- ✅ Chat messages in IDE
- ✅ "Add to Report" features
- ✅ Section writing assistance
- ✅ Any backend `/api/agent` calls

---

## 🔍 New Utilities (For Developers)

### Citation Validator
```typescript
import { validateCitations, extractCitations } from '@/lib/agent/citationValidator';

// Check if response is properly cited
const { passed, issues } = validateCitations(response);

// Extract all citations
const citations = extractCitations(response);
// Returns: [{ source: 'file.pdf', page: 42 }]
```

### Grounding Enforcer
```typescript
import { checkGrounding, enforceGrounding } from '@/lib/agent/groundingEnforcer';

// Verify response grounded in materials
const { isGrounded, hallucinations } = checkGrounding(response);

// Force strict grounding (converts hallucinated response)
const safeResponse = enforceGrounding(response);
```

---

## 📊 Example: Correct Response Format

```
User: "What does the paper say about machine learning?"

AI: "According to Chen & Park (2023), machine learning models 
achieve 92% accuracy on classification tasks (Source: chen_park_2023.pdf, p. 18). 
This is particularly true for deep learning approaches 
(Source: chen_park_2023.pdf, p. 25).

The paper also suggests that ensemble methods can improve performance 
(Source: chen_park_2023.pdf, p. 31-33).

Sources: [chen_park_2023.pdf, p. 18; chen_park_2023.pdf, p. 25; chen_park_2023.pdf, p. 31-33]"
```

---

## ❌ What the AI Refuses

❌ **"Is machine learning better than statistical methods?"**
→ Response: "I don't have this in your uploaded materials. To discuss this, please upload papers comparing machine learning and statistical approaches."

❌ **"What's the latest in AI?"**
→ Response: "I don't have this in your uploaded materials."

---

## 🛠️ Files Changed

| File | Change |
|------|--------|
| `src/lib/agent/buildSystemPrompt.ts` | ✅ Enhanced system prompt (7 strict rules) |
| `src/app/api/agent/route.ts` | ✅ Citation enforcement logging |
| `src/lib/agent/citationValidator.ts` | ✨ NEW: Citation validation |
| `src/lib/agent/groundingEnforcer.ts` | ✨ NEW: Grounding enforcement |
| `tests/unit/buildSystemPrompt.test.ts` | ✅ Fixed test model type |

---

## ✅ Verification

```
✅ npm run typecheck  → PASS (0 errors)
✅ npm run build      → PASS (clean build)
✅ npm run lint       → PASS (no errors, only warnings)
```

---

## 📖 Full Documentation

See: `/AI_ASSISTANT_IMPROVEMENTS.md` for comprehensive details

---

## 🚀 How It Works (Behind the Scenes)

1. User sends message in chat
2. System prompt (with strict rules) is sent to LLM
3. RAG retrieves relevant chunks from uploaded materials
4. System prompt is enriched with those chunks
5. LLM generates response (constrained by system prompt to cite sources)
6. Response is streamed to user with citation footer
7. Console logs track citation compliance

---

**Status: Production Ready** ✅
All changes backward compatible, no breaking changes.
