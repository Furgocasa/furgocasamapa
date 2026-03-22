import OpenAI from 'openai'

const CACHE_TTL_MS = 10 * 60 * 1000
const ALLOWED_PREFIXES = ['gpt-', 'o1', 'o3', 'o4']

let cachedModels: string[] = []
let cachedAt = 0

function getApiKey() {
  return process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY_ADMIN || ''
}

export async function listAvailableOpenAIModels(forceRefresh = false): Promise<string[]> {
  const now = Date.now()
  const useCache = !forceRefresh && cachedModels.length > 0 && now - cachedAt < CACHE_TTL_MS

  if (useCache) {
    return cachedModels
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no configurada')
  }

  const openai = new OpenAI({ apiKey })
  const response = await openai.models.list()

  const models = (response.data || [])
    .map((model: any) => model.id)
    .filter((id: string) => ALLOWED_PREFIXES.some((prefix) => id.startsWith(prefix)))
    .sort((a: string, b: string) => a.localeCompare(b))

  cachedModels = models
  cachedAt = now
  return models
}

export async function validateOpenAIModel(model: string): Promise<{
  valid: boolean
  reason?: string
  availableModelsCount: number
}> {
  const modelId = (model || '').trim()
  if (!modelId) {
    return {
      valid: false,
      reason: 'Modelo vacío',
      availableModelsCount: 0
    }
  }

  try {
    const models = await listAvailableOpenAIModels()
    const exists = models.includes(modelId)

    return {
      valid: exists,
      reason: exists ? undefined : `El modelo "${modelId}" no aparece en tu catálogo OpenAI`,
      availableModelsCount: models.length
    }
  } catch (error: any) {
    return {
      valid: false,
      reason: error?.message || 'No se pudo validar el modelo con OpenAI',
      availableModelsCount: 0
    }
  }
}
