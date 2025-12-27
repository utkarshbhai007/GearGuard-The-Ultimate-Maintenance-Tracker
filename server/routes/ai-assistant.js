const express = require('express');
const { Groq } = require('groq-sdk');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// AI Assistant chat endpoint
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    const { user } = req;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create system prompt with GearGuard context
    const systemPrompt = `You are GearGuard AI Assistant, a helpful AI integrated into the GearGuard Maintenance Management System. 

Your role is to help users with:
- Equipment maintenance guidance and troubleshooting
- Maintenance scheduling and planning advice
- Safety protocols and best practices
- Technical support for equipment issues
- Workflow optimization suggestions
- System usage help

Current user context:
- User: ${user.first_name} ${user.last_name}
- Role: ${user.role}
- Email: ${user.email}

Additional context: ${context || 'No additional context provided'}

Please provide helpful, accurate, and professional responses related to maintenance management. Keep responses concise but informative. If asked about topics outside maintenance management, politely redirect to maintenance-related topics.`;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      model: 'llama3-8b-8192', // Using Llama 3 8B model
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      stream: false
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Log the conversation for analytics (optional)
    console.log(`AI Assistant - User: ${user.email}, Message: ${message.substring(0, 100)}...`);

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Assistant Error:', error);
    
    // Handle specific Groq API errors
    if (error.status === 401) {
      return res.status(500).json({ 
        error: 'AI service authentication failed. Please check API configuration.' 
      });
    } else if (error.status === 429) {
      return res.status(429).json({ 
        error: 'AI service rate limit exceeded. Please try again later.' 
      });
    } else if (error.status === 400) {
      return res.status(400).json({ 
        error: 'Invalid request to AI service.' 
      });
    }

    res.status(500).json({ 
      error: 'AI assistant is temporarily unavailable. Please try again later.' 
    });
  }
});

// Get AI suggestions for maintenance tasks
router.post('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { equipmentType, issue, urgency } = req.body;
    const { user } = req;

    const prompt = `As a maintenance expert, provide specific suggestions for:
Equipment Type: ${equipmentType || 'General equipment'}
Issue: ${issue || 'General maintenance'}
Urgency Level: ${urgency || 'Normal'}

Please provide:
1. Immediate actions to take
2. Safety considerations
3. Required tools/parts
4. Estimated time to complete
5. Prevention tips

Keep the response practical and actionable.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a maintenance expert providing specific, actionable advice for equipment maintenance and repair tasks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.5,
      max_tokens: 800
    });

    const suggestions = completion.choices[0]?.message?.content || 'Unable to generate suggestions at this time.';

    res.json({
      success: true,
      suggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Suggestions Error:', error);
    res.status(500).json({ 
      error: 'Unable to generate suggestions at this time.' 
    });
  }
});

module.exports = router;