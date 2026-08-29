// Supabase Edge Function: Assamese text-to-speech through BHASHINI.
// Credentials remain in Supabase secrets and are never returned to the client.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const userID = Deno.env.get('BHASHINI_USER_ID')
  const ulcaApiKey = Deno.env.get('BHASHINI_ULCA_API_KEY')
  const pipelineId = Deno.env.get('BHASHINI_PIPELINE_ID')
  if (!userID || !ulcaApiKey || !pipelineId) return json({ error: 'BHASHINI TTS is not configured' }, 503)

  try {
    const body = await request.json()
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    if (body.language !== 'as' || !text || text.length > 1000) return json({ error: 'A valid Assamese text value is required' }, 400)

    const configResponse = await fetch('https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', userID, ulcaApiKey },
      body: JSON.stringify({ pipelineId, pipelineTasks: [{ taskType: 'tts', config: { language: { sourceLanguage: 'as' } } }] }),
    })
    if (!configResponse.ok) return json({ error: 'BHASHINI pipeline configuration failed' }, 502)
    const pipeline = await configResponse.json()
    const endpoint = pipeline?.pipelineInferenceAPIEndPoint ?? pipeline?.pipelineInferenceAPIEnfPoint
    const callbackURL = endpoint?.callbackUrl ?? endpoint?.callbackURL
    const inferenceKey = endpoint?.inferenceApiKey
    if (!callbackURL || !inferenceKey?.name || !inferenceKey?.value) return json({ error: 'BHASHINI returned an incomplete pipeline configuration' }, 502)

    const serviceId = pipeline?.pipelineResponseConfig?.[0]?.config?.[0]?.serviceId
    const computeResponse = await fetch(callbackURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [inferenceKey.name]: inferenceKey.value },
      body: JSON.stringify({ pipelineTasks: [{ taskType: 'tts', config: { language: { sourceLanguage: 'as' }, ...(serviceId ? { serviceId } : {}) } }], inputData: { input: [{ source: text }] } }),
    })
    if (!computeResponse.ok) return json({ error: 'BHASHINI speech generation failed' }, 502)
    const result = await computeResponse.json()
    const audioBase64 = result?.pipelineResponse?.[0]?.audio?.[0]?.audioContent
    if (!audioBase64) return json({ error: 'BHASHINI returned no audio' }, 502)
    return json({ audioBase64, contentType: 'audio/wav' })
  } catch (error) {
    console.error('BHASHINI TTS error', error)
    return json({ error: 'Speech generation is temporarily unavailable' }, 500)
  }
})
