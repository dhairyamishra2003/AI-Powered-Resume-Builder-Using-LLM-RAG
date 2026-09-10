import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import Resume from '../models/Resume.model.js';
import { normalizeSectionData } from '../services/resume.service.js';
import { searchKnowledgeBase } from '../services/rag.service.js';

// Factory function — creates tools with access to request context (resumeId, etc.)
// Uses closure pattern so each tool can access the shared context
export const createAgentTools = (context, aiService) => {
  // Tool 1: Update any resume section with structured data
  const updateResumeSectionTool = new DynamicStructuredTool({
    name: 'update_resume_section',
    description:
      'Updates a specific section of the resume with structured data extracted from the conversation. Call this when you have gathered enough information from the user to fill in a resume section.',
    schema: z.object({
      sectionName: z
        .enum(['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'])
        .describe('The resume section to update'),
      sectionData: z
        .any()
        .describe(
          'The structured data for the section. For experience: array of {company, role, startDate, endDate, current, bullets}. For education: array of {institution, degree, field, startDate, endDate, gpa}. For skills: {technical: [], soft: [], languages: []}. For personalInfo: {fullName, email, phone, location, linkedIn, portfolio}. For certifications: array of {name, issuer, date, link}. For summary: pass as {text: "summary string"}.'
        ),
    }),
    func: async ({ sectionName, sectionData }) => {
      const dataToSave = normalizeSectionData(sectionName, sectionData);

      await Resume.findByIdAndUpdate(context.resumeId, {
        $set: { [`sections.${sectionName}`]: dataToSave },
      });

      context.lastExtractedData = { section: sectionName, data: dataToSave };

      return `Updated ${sectionName} section successfully.`;
    },
  });

  // Tool 2: Generate STAR-method bullet points
  const generateStarBulletsTool = new DynamicStructuredTool({
    name: 'generate_star_bullets',
    description:
      'Generates improved STAR-method bullet points for a work experience entry. Call this when the user wants to improve their bullet points.',
    schema: z.object({
      rawExperience: z.string().describe('The raw experience description to improve'),
      company: z.string().optional().describe('The company name for context'),
      role: z.string().optional().describe('The job role/title for context'),
    }),
    func: async ({ rawExperience, company, role }) => {
      const result = await aiService.generateBullets({
        rawExperience: rawExperience || '',
        company: company || '',
        role: role || '',
        targetRole: context.targetRole || '',
        jobDescription: context.jobDescription || '',
      });
      return JSON.stringify(result);
    },
  });

  // Tool 3: Run ATS score analysis
  const getAtsScoreTool = new DynamicStructuredTool({
    name: 'get_ats_score',
    description:
      'Runs an ATS analysis on the current resume. Call this when the user asks about their ATS score or after significant updates.',
    schema: z.object({
      jobDescription: z.string().optional().describe('The job description to score against.'),
    }),
    func: async ({ jobDescription }) => {
      const resume = await Resume.findById(context.resumeId);
      const result = await aiService.getAtsScore({
        sections: resume?.sections || {},
        jobDescription: jobDescription || context.jobDescription || '',
        targetRole: context.targetRole || '',
      });
      return JSON.stringify({ overall: result.overall, suggestions: result.suggestions || [] });
    },
  });

  // Tool 4: Generate professional summary
  const generateSummaryTool = new DynamicStructuredTool({
    name: 'generate_summary',
    description:
      'Generates a professional summary based on all resume information gathered so far.',
    schema: z.object({}),
    func: async () => {
      const resume = await Resume.findById(context.resumeId);
      const result = await aiService.generateSummary({
        sections: resume?.sections || {},
        targetRole: context.targetRole || '',
        jobDescription: context.jobDescription || '',
      });
      return JSON.stringify(result);
    },
  });

  // Tool 5: Search knowledge base (RAG) for role-specific advice and examples
  const searchKnowledgeBaseTool = new DynamicStructuredTool({
    name: 'search_knowledge_base',
    description:
      'Searches the knowledge base for role-specific resume advice, industry best practices, keyword recommendations, skill taxonomies, and high-quality resume examples. Use this when the user asks for advice about a specific role, industry keywords, ATS tips, or resume writing best practices.',
    schema: z.object({
      query: z.string().describe('The search query to find relevant information. Be descriptive, e.g., "best practices for software engineer resume" or "action verbs for leadership experience"'),
    }),
    func: async ({ query }) => {
      const result = await searchKnowledgeBase(query, 5);
      return result;
    },
  });

  return [updateResumeSectionTool, generateStarBulletsTool, getAtsScoreTool, generateSummaryTool, searchKnowledgeBaseTool];
};
