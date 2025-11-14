import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant'; // Fast and efficient model

/**
 * Call Groq API with a system prompt and user content
 */
async function callGroqAPI(systemPrompt, userContent, apiKey) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'AI service error');
  }
}

/**
 * Summarize text
 */
export async function summarizeText(content, apiKey) {
  const systemPrompt = `You are a helpful assistant that creates concise summaries. 
Summarize the given text in 1-2 sentences. Be clear and capture the main points.`;

  return await callGroqAPI(systemPrompt, content, apiKey);
}

/**
 * Suggest tags
 */
export async function suggestTags(content, apiKey) {
  const systemPrompt = `You are a helpful assistant that suggests relevant tags for notes.
Analyze the content and suggest 5 relevant, concise tags (single words or short phrases).
Return ONLY a comma-separated list of tags, nothing else.
Example output: productivity, meeting, project, deadline, team`;

  const response = await callGroqAPI(systemPrompt, content, apiKey);
  
  // Parse comma-separated tags
  return response
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, 5); // Ensure max 5 tags
}

/**
 * Check and fix grammar
 */
export async function checkGrammar(content, apiKey) {
  const systemPrompt = `You are a grammar and spelling expert.
Fix any grammar, spelling, or punctuation errors in the given text.
Preserve the original meaning and style as much as possible.
If the text is already correct, return it unchanged.
Return ONLY the corrected text, no explanations.`;

  return await callGroqAPI(systemPrompt, content, apiKey);
}

/**
 * Generate glossary with key terms and definitions
 */
export async function generateGlossary(content, apiKey) {
  const systemPrompt = `You are a helpful assistant that identifies key technical or important terms in text.
Analyze the content and identify up to 5 key terms that would benefit from definitions.
Return your response as a valid JSON array with this exact format:
[{"term": "example term", "definition": "brief definition"}]

Rules:
- Return ONLY valid JSON, nothing else
- Include 3-5 terms maximum
- Keep definitions concise (under 20 words)
- Focus on technical, domain-specific, or uncommon terms`;

  const response = await callGroqAPI(systemPrompt, content, apiKey);
  
  try {
    // Try to parse JSON response
    // Remove any markdown code blocks if present
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const glossary = JSON.parse(cleanedResponse);
    
    // Validate structure
    if (Array.isArray(glossary) && glossary.every(item => item.term && item.definition)) {
      return glossary;
    }
    
    throw new Error('Invalid glossary format');
  } catch (error) {
    console.error('Failed to parse glossary:', response);
    // Return empty array if parsing fails
    return [];
  }
}

/**
 * Find grammar errors and return corrections as array
 */
export async function findGrammarErrors(content, apiKey) {
  const systemPrompt = `You are a grammar expert. Analyze the text and find grammar/spelling errors.
Return a JSON array of error objects. Each object must have "error" (the mistake) and "correction" (the fix).
Example: [{"error": "your wrong", "correction": "you're wrong"}, {"error": "its good", "correction": "it's good"}]
If no errors found, return an empty array: []
Return ONLY valid JSON, nothing else.`;

  const response = await callGroqAPI(systemPrompt, content, apiKey);
  
  try {
    // Clean response
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const errors = JSON.parse(cleanedResponse);
    
    // Validate structure
    if (Array.isArray(errors)) {
      return errors.filter(item => item.error && item.correction);
    }
    
    return [];
  } catch (error) {
    console.error('Failed to parse grammar errors:', response);
    return [];
  }
}