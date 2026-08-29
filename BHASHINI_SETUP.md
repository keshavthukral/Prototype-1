# BHASHINI Assamese TTS setup

The app uses a Supabase Edge Function so BHASHINI credentials never enter Vite or browser JavaScript. Without these credentials, English browser speech and any cached Assamese audio continue to work; Assamese requests show a calm availability message.

## Credentials required

Sign in to the BHASHINI/ULCA integration portal and obtain:

1. `userID` — the integrator identifier shown in **My Profile**.
2. `ulcaApiKey` — the API key shown with that user ID in **My Profile**.
3. A Pipeline ID that supports a `TTS` task for Assamese (`as`). BHASHINI currently lists Assamese-capable TTS services including `Bhashini/IITM/TTS`; select an available pipeline through the portal rather than hard-coding a model in the browser.

BHASHINI’s official flow uses the `userID` and `ulcaApiKey` for the mandatory Pipeline Config call. That response supplies the compute callback URL and inference authorization header used server-side by the function.

## Configure Supabase secrets

```bash
supabase secrets set BHASHINI_USER_ID="your-user-id"
supabase secrets set BHASHINI_ULCA_API_KEY="your-ulca-api-key"
supabase secrets set BHASHINI_PIPELINE_ID="your-assamese-tts-pipeline-id"
```

Never create `VITE_BHASHINI_*` variables. Variables prefixed with `VITE_` are bundled into client JavaScript.

## Deploy

```bash
supabase functions deploy bhashini-tts
```

The frontend also needs the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values so it can invoke the function. The anon key is not a BHASHINI credential.

## Verify

1. Select Assamese in the app.
2. On a device without a local Assamese voice, press **Hear Again** while online.
3. Confirm audio plays and repeat once so the same deterministic `language + text` cache entry is reused.
4. Go offline and repeat the same phrase; cached audio should play.
5. Try an uncached phrase offline; the app should show **Voice unavailable offline.** and should not use another language’s voice.

Useful fixed phrases are cached automatically after successful generation, including Welcome, activity instructions, completion feedback, reminders, memories, and help prompts.

Official references:

- [BHASHINI Pipeline Config Call](https://dibd-bhashini.gitbook.io/bhashini-apis/pipeline-config-call)
- [BHASHINI Pipeline Compute Call](https://dibd-bhashini.gitbook.io/bhashini-apis/pipeline-compute-call)
- [BHASHINI available models](https://dibd-bhashini.gitbook.io/bhashini-apis/available-models-for-usage)
