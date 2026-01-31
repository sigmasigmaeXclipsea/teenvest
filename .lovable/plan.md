
# Use Your Own Google Gemini API Key

## Summary
Switch all 8 AI edge functions from Lovable AI gateway to your personal Google AI API, using the cheapest model (`gemini-2.5-flash-lite`) for maximum savings.

## Cost Savings

| Before (Lovable AI) | After (Your API Key) |
|---------------------|----------------------|
| Uses Lovable credits | Uses your Google quota |
| ~$0.075-$0.30/1M tokens | $0.10 input / $0.40 output per 1M |
| Limited by credit balance | 1M tokens/day FREE tier |

**Result**: You get free daily usage (up to limits), then pay Google directly at the lowest rates.

---

## Step 1: Add Your API Key as a Secret

Add `GOOGLE_AI_API_KEY` to Cloud Secrets with your key value.

---

## Step 2: Update All Edge Functions

### Changes for each function:

**API Endpoint Change:**
```text
Before: https://ai.gateway.lovable.dev/v1/chat/completions
After:  https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

**Headers Change:**
```text
Before: Authorization: Bearer ${LOVABLE_API_KEY}
After:  Authorization: Bearer ${GOOGLE_AI_API_KEY}
```

**Model Change:**
```text
Before: google/gemini-1.5-flash
After:  gemini-2.5-flash-lite
```

### Files to update (8 total):

1. `supabase/functions/chat/index.ts`
   - Line 86-90: Change key variable from `LOVABLE_API_KEY` to `GOOGLE_AI_API_KEY`
   - Line 102: Change URL to Google's API
   - Line 105: Update Authorization header
   - Line 109: Change model to `gemini-2.5-flash-lite`
   - Line 164: Update cost logging model name

2. `supabase/functions/learning-ai/index.ts`
   - Line 86-90: Change key variable
   - Line 117: Change URL
   - Line 120: Update header
   - Line 124: Change model

3. `supabase/functions/gemini-news/index.ts`
   - Line 21-25: Change key variable
   - Line 67: Change URL
   - Line 70: Update header
   - Line 74: Change model

4. `supabase/functions/stock-news/index.ts`
   - Line 52-56: Change key variable
   - Line 76: Change URL
   - Line 79: Update header
   - Line 83: Change model

5. `supabase/functions/market-news-explained/index.ts`
   - Same pattern: key variable, URL, header, model

6. `supabase/functions/portfolio-health-ai/index.ts`
   - Same pattern: key variable, URL, header, model

7. `supabase/functions/mistake-analysis-ai/index.ts`
   - Same pattern: key variable, URL, header, model

8. `supabase/functions/portfolio-timeline-ai/index.ts`
   - Same pattern: key variable, URL, header, model

### Update cost monitor:

9. `supabase/functions/_shared/cost-monitor.ts`
   - Add `gemini-2.5-flash-lite` pricing entry
   - Update model references

---

## Step 3: Security Recommendation

After implementation, regenerate your API key at [Google AI Studio](https://aistudio.google.com/apikey) since you shared it in chat, then update the secret value in Cloud.

---

## Technical Details

### Google AI API Format
Google's OpenAI-compatible endpoint uses the same request/response format as Lovable AI gateway, so only the URL, key, and model name need to change.

### Error Handling
Keep existing 429/402 error handling - Google's API uses the same status codes for rate limiting.

### Fallback Option
If Google's API has issues, the functions can be easily switched back to Lovable AI by reverting the URL and key.
