import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { summarizeText, suggestTags, checkGrammar, generateGlossary } from './aiService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large notes

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Shareable Notes AI Proxy Server ✅',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Check if API key is configured
app.get('/api/health', (req, res) => {
  const hasApiKey = !!GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here';
  
  res.json({
    status: 'ok',
    apiKeyConfigured: hasApiKey,
    message: hasApiKey ? 'AI service ready' : 'API key not configured'
  });
});

// Main AI endpoint
app.post('/api/ai', async (req, res) => {
  try {
    const { task, content } = req.body;

    // Validation
    if (!task || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: task and content'
      });
    }

    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured. Please set GROQ_API_KEY in environment variables.'
      });
    }

    // Limit content length to prevent abuse
    if (content.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Content too large. Maximum 50,000 characters allowed.'
      });
    }

    console.log(`[${new Date().toISOString()}] AI Request - Task: ${task}, Content length: ${content.length}`);

    let result;

    // Route to appropriate AI function based on task
    switch (task) {
      case 'summarize':
        result = await summarizeText(content, GROQ_API_KEY);
        break;

      case 'tags':
        result = await suggestTags(content, GROQ_API_KEY);
        break;

      case 'grammar':
        result = await checkGrammar(content, GROQ_API_KEY);
        break;

      case 'glossary':
        result = await generateGlossary(content, GROQ_API_KEY);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown task: ${task}. Valid tasks are: summarize, tags, grammar, glossary`
        });
    }

    console.log(`[${new Date().toISOString()}] AI Response - Task: ${task}, Success: true`);

    res.json({
      success: true,
      task,
      data: result
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] AI Error:`, error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred processing your request',
      task: req.body.task
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Shareable Notes AI Proxy Server`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🤖 AI Service: ${GROQ_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(50)}\n`);
});