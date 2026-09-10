// ============================================
// agent.service.js - AI Interview Agent
// ============================================
// Handles conversational resume building via Gemini.
// Uses a direct Gemini API approach with manual tool
// dispatch to avoid the thought_signature compatibility
// issue in @langchain/google-genai + LangGraph.
// ============================================

import { GoogleGenAI } from '@google/genai';
import Resume from '../models/Resume.model.js';
import { normalizeSectionData } from './resume.service.js';
import * as aiService from './ai.service.js';
import { searchKnowledgeBase } from './rag.service.js';
import { toGeminiError } from '../config/gemini.config.js';

const AGENT_MODEL_NAME = process.env.GEMINI_AGENT_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ---- Simple message detection ----
const SIMPLE_PATTERNS = [
  /^(hi|hello|hey|howdy|greetings|yo)\b/i,
  /^(thanks?|thank\s*you|ty|thx|cheers)\b/i,
  /^(okay|ok|sure|alright|got\s*it|sounds\s*good|great|perfect|nice|cool|awesome)\b/i,
  /^(good\s*(morning|afternoon|evening|night|day))\b/i,
  /^(bye|goodbye|see\s*ya|later|cya|farewell)\b/i,
  /^(how\s*are\s*you|what'?s\s*up|how\s*is\s*it\s*going)\b/i,
  /^(yes|no|nope|yep|yeah)\b/i,
];

const SIMPLE_RESPONSES = {
  greeting: "Hi! I'm your AI resume assistant. What would you like to work on — experience, skills, summary, or something else?",
  thanks: "You're welcome! What would you like to improve next?",
  okay: "Got it! Let me know what you'd like to work on next.",
  goodbye: "Good luck with your resume! Feel free to come back anytime.",
  howAreYou: "I'm here and ready to help with your resume! What section would you like to work on?",
};

const getSimpleResponse = (message) => {
  const msg = message.trim().toLowerCase();
  if (/^(hi|hello|hey|howdy|greetings|yo)\b/.test(msg)) return SIMPLE_RESPONSES.greeting;
  if (/^(thanks?|thank\s*you|ty|thx|cheers)\b/.test(msg)) return SIMPLE_RESPONSES.thanks;
  if (/^(bye|goodbye|see\s*ya|later|cya|farewell)\b/.test(msg)) return SIMPLE_RESPONSES.goodbye;
  if (/^(how\s*are\s*you|what'?s\s*up|how\s*is\s*it\s*going)\b/.test(msg)) return SIMPLE_RESPONSES.howAreYou;
  if (/^(okay|ok|sure|alright|got\s*it|sounds\s*good|great|perfect|nice|cool|awesome|yes|no|nope|yep|yeah)\b/.test(msg)) return SIMPLE_RESPONSES.okay;
  return null;
};

const isSimpleMessage = (message) => {
  const msg = message.trim();
  // Short messages under 8 words that match simple patterns
  if (msg.split(/\s+/).length > 8) return false;
  return SIMPLE_PATTERNS.some((p) => p.test(msg));
};

// ---- Tool definitions for Gemini function calling ----
const TOOL_DEFINITIONS = [
  {
    name: 'update_resume_section',
    description: 'Updates a specific section of the resume with structured data extracted from the conversation. Call this ONLY when you have gathered enough concrete information from the user to fill in a resume section.',
    parameters: {
      type: 'object',
      properties: {
        sectionName: {
          type: 'string',
          enum: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
          description: 'The resume section to update',
        },
        sectionData: {
          type: 'object',
          description: 'The structured data. For experience: array of {company, role, startDate, endDate, current, bullets}. For education: array of {institution, degree, field, startDate, endDate, gpa}. For skills: {technical: [], soft: [], languages: []}. For personalInfo: {fullName, email, phone, location, linkedIn, portfolio}. For certifications: array of {name, issuer, date, link}. For summary: {text: "the summary"}.',
        },
      },
      required: ['sectionName', 'sectionData'],
    },
  },
  {
    name: 'generate_star_bullets',
    description: 'Generates improved STAR-method bullet points for a work experience entry. Use when the user wants to improve their bullet points.',
    parameters: {
      type: 'object',
      properties: {
        rawExperience: { type: 'string', description: 'The raw experience description to improve' },
        company: { type: 'string', description: 'The company name for context' },
        role: { type: 'string', description: 'The job role/title for context' },
      },
      required: ['rawExperience'],
    },
  },
  {
    name: 'get_ats_score',
    description: 'Runs an ATS analysis on the current resume. Use only when the user explicitly asks about their ATS score.',
    parameters: {
      type: 'object',
      properties: {
        jobDescription: { type: 'string', description: 'Optional job description to score against' },
      },
      required: [],
    },
  },
  {
    name: 'generate_summary',
    description: 'Generates a professional summary based on resume information. Use when the user asks for a professional summary.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'search_knowledge_base',
    description: 'Searches for role-specific resume advice, industry best practices, and examples. Use when the user asks for advice about a specific role or industry.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query, e.g., "best practices for software engineer resume"' },
      },
      required: ['query'],
    },
  },
];

// ---- Tool executor ----
const executeTool = async (toolName, toolArgs, context) => {
  try {
    switch (toolName) {
      case 'update_resume_section': {
        const { sectionName, sectionData } = toolArgs;
        const dataToSave = normalizeSectionData(sectionName, sectionData);
        await Resume.findByIdAndUpdate(context.resumeId, {
          $set: { [`sections.${sectionName}`]: dataToSave },
        });
        context.lastExtractedData = { section: sectionName, data: dataToSave };
        return `Updated ${sectionName} section successfully.`;
      }
      case 'generate_star_bullets': {
        const result = await aiService.generateBullets({
          rawExperience: toolArgs.rawExperience || '',
          company: toolArgs.company || '',
          role: toolArgs.role || '',
          targetRole: context.targetRole || '',
          jobDescription: context.jobDescription || '',
        });
        return JSON.stringify(result);
      }
      case 'get_ats_score': {
        const resume = await Resume.findById(context.resumeId);
        const result = await aiService.getAtsScore({
          sections: resume?.sections || {},
          jobDescription: toolArgs.jobDescription || context.jobDescription || '',
          targetRole: context.targetRole || '',
        });
        return JSON.stringify({ overall: result.overall, suggestions: result.suggestions || [] });
      }
      case 'generate_summary': {
        const resume = await Resume.findById(context.resumeId);
        const result = await aiService.generateSummary({
          sections: resume?.sections || {},
          targetRole: context.targetRole || '',
          jobDescription: context.jobDescription || '',
        });
        return JSON.stringify(result);
      }
      case 'search_knowledge_base': {
        const result = await searchKnowledgeBase(toolArgs.query, 5);
        return result;
      }
      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    console.error(`Tool ${toolName} failed:`, error.message);
    return `Tool ${toolName} encountered an error: ${error.message}`;
  }
};

// ---- Build system instruction ----
const buildSystemInstruction = (data) => `You are a concise, professional AI resume assistant helping a user build their resume.

CURRENT RESUME DATA:
${JSON.stringify(data.currentSections || {}, null, 2)}

TARGET ROLE: ${data.targetRole || 'Not specified'}
SECTION FOCUS: ${data.sectionTargeted || 'general'}

RULES:
1. Keep responses SHORT and focused — 2-4 sentences maximum for conversational turns.
2. Ask ONE focused question at a time.
3. Use tools ONLY when necessary (user explicitly asks, or enough info gathered to save).
4. Handle greetings naturally and briefly — do not summarize resume state unless asked.
5. Do NOT mention internal tools, APIs, or implementation details.
6. For resume improvement tasks, provide specific actionable advice.
7. When gathering experience info, ask about metrics and measurable achievements.
8. Save data only when you have enough concrete information.`;

// ---- Main agent function ----
export const runInterviewAgent = async (data) => {
  // Fast path: detect simple/conversational messages
  if (isSimpleMessage(data.message)) {
    const simpleReply = getSimpleResponse(data.message);
    if (simpleReply) {
      return { message: simpleReply, extractedData: null, isComplete: false };
    }
  }

  const context = {
    resumeId: data.resumeId,
    targetRole: data.targetRole || '',
    jobDescription: data.jobDescription || '',
    lastExtractedData: null,
  };

  // Build conversation history ensuring valid Gemini turn alternation (user -> model -> user)
  const incoming = data.conversationHistory || [];
  const sanitizedHistory = [];

  for (const item of incoming) {
    const role = item.role === 'user' ? 'user' : 'model';
    const text = (item.content || '').trim();
    if (!text) continue;

    if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === role) {
      sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += `\n${text}`;
    } else {
      sanitizedHistory.push({ role, parts: [{ text }] });
    }
  }

  // If history ends with user turn, remove it so current user message creates alternating turn
  if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
    sanitizedHistory.pop();
  }

  // Build Gemini contents array
  const contents = [
    ...sanitizedHistory,
    { role: 'user', parts: [{ text: data.message }] },
  ];

  const tools = [{ functionDeclarations: TOOL_DEFINITIONS }];

  let finalMessage = 'I can help you with your resume. What would you like to work on?';

  try {
    // Agentic loop — max 5 iterations to prevent runaway tool calls
    for (let iteration = 0; iteration < 5; iteration++) {
      const response = await ai.models.generateContent({
        model: AGENT_MODEL_NAME,
        systemInstruction: buildSystemInstruction(data),
        contents,
        tools,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });

      const candidate = response.candidates?.[0];
      if (!candidate) break;

      const parts = candidate.content?.parts || [];
      const textParts = parts.filter((p) => typeof p.text === 'string' && p.text.trim());
      const toolCallParts = parts.filter((p) => p.functionCall);

      // If there's a text response and no tool calls — we're done
      if (textParts.length > 0 && toolCallParts.length === 0) {
        finalMessage = textParts.map((p) => p.text).join('\n').trim();
        break;
      }

      // If there are tool calls, execute them
      if (toolCallParts.length > 0) {
        // Add the model's response (with tool calls) to contents
        contents.push({ role: 'model', parts });

        // Execute each tool and collect results
        const toolResults = [];
        for (const part of toolCallParts) {
          const { name, args } = part.functionCall;
          const toolOutput = await executeTool(name, args || {}, context);
          toolResults.push({
            functionResponse: {
              name,
              response: { output: toolOutput },
            },
          });
        }

        // Add tool results as user turn and continue loop
        contents.push({ role: 'user', parts: toolResults });

        // If model also had text parts alongside tools, capture that
        if (textParts.length > 0) {
          finalMessage = textParts.map((p) => p.text).join('\n').trim();
        }
        continue;
      }

      // No text and no tool calls — fallback
      if (textParts.length > 0) {
        finalMessage = textParts.map((p) => p.text).join('\n').trim();
      }
      break;
    }
  } catch (error) {
    throw toGeminiError(error, AGENT_MODEL_NAME);
  }

  return {
    message: finalMessage,
    extractedData: context.lastExtractedData,
    isComplete: context.lastExtractedData !== null,
  };
};
