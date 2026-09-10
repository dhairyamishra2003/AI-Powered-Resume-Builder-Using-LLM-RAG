export const resumeParserPrompt = (resumeText) => `You are an expert resume parser. Extract structured data from this resume text.\r
\r
RESUME TEXT:\r
${resumeText}\r
\r
Parse the resume and extract ALL information into this EXACT JSON format:\r
{\r
  "personalInfo": {\r
    "fullName": "",\r
    "email": "",\r
    "phone": "",\r
    "location": "",\r
    "linkedIn": "",\r
    "portfolio": ""\r
  },\r
  "summary": "professional summary text if present",\r
  "experience": [\r
    {\r
      "company": "",\r
      "role": "",\r
      "startDate": "YYYY-MM format",\r
      "endDate": "YYYY-MM format or empty if current",\r
      "current": false,\r
      "bullets": ["bullet point 1", "bullet point 2"]\r
    }\r
  ],\r
  "education": [\r
    {\r
      "institution": "",\r
      "degree": "",\r
      "field": "",\r
      "startDate": "",\r
      "endDate": "",\r
      "gpa": ""\r
    }\r
  ],\r
  "skills": {\r
    "technical": ["skill1", "skill2"],\r
    "soft": ["skill1"],\r
    "languages": ["English"]\r
  },\r
  "projects": [],\r
  "certifications": []\r
}\r
\r
Extract EVERYTHING you can find. Convert dates to YYYY-MM format. If information is missing, leave as empty string or empty array. Respond ONLY with valid JSON.`;

export const bulletWriterPrompt = (data, ragContext = '') => `You are an expert resume writer specializing in STAR-method bullet points.\r
\r
CONTEXT:\r
- Role: ${data.role || ''} at ${data.company || ''}\r
- Target position: ${data.targetRole || ''}\r
- Job Description Keywords: ${data.jobDescription || ''}\r
\r
${ragContext ? `KNOWLEDGE BASE CONTEXT (use these as inspiration for style and quality):\r
${ragContext}\r
\r
` : ''}RAW EXPERIENCE:\r
${data.rawExperience || ''}\r
\r
RULES:\r
1. Write 3-5 bullet points using STAR method (Situation, Task, Action, Result)\r
2. Start each bullet with a strong action verb (Led, Developed, Optimized, Architected, Spearheaded, etc.)\r
3. Include specific metrics and numbers (%, $, time saved, users impacted)\r
4. If user didn't provide numbers, create realistic placeholder metrics marked with [X]\r
5. Tailor language to match the target position keywords\r
6. Each bullet should be 1-2 lines maximum\r
7. Use present tense for current roles, past tense for previous roles\r
8. If knowledge base context is provided, use similar style and quality level\r
\r
You MUST respond with valid JSON in this exact format:\r
{\r
  "bullets": [\r
    "Developed and launched a React-based dashboard serving 10,000+ daily users, reducing page load time by 40%",\r
    "Led migration of legacy REST APIs to GraphQL, improving data fetching efficiency by 60% across 12 microservices"\r
  ],\r
  "improvementNotes": "Brief explanation of what was improved and why"\r
}`;


export const summaryWriterPrompt = (data, ragContext = '') => `You are a professional resume writer crafting a compelling professional summary.\r
\r
RESUME DATA:\r
${JSON.stringify(data.sections || {}, null, 2)}\r
\r
TARGET ROLE: ${data.targetRole || ''}\r
JOB DESCRIPTION: ${data.jobDescription || ''}\r
\r
${ragContext ? `KNOWLEDGE BASE CONTEXT (reference these for style and quality):\r
${ragContext}\r
\r
` : ''}RULES:\r
1. Write a 2-4 sentence professional summary\r
2. Highlight years of experience, key skills, and notable achievements\r
3. Tailor to the target role and job description keywords\r
4. Use confident, professional language\r
5. Include at least one quantifiable achievement\r
6. If example summaries are provided in context, match their quality and style\r
\r
You MUST respond with valid JSON:\r
{\r
  "summary": "Your professional summary text here",\r
  "keywords_used": ["keyword1", "keyword2"]\r
}`;


export const atsScorerPrompt = (data, ragContext = '') => `You are an ATS (Applicant Tracking System) expert who scores resumes.\r
\r
RESUME SECTIONS:\r
${JSON.stringify(data.sections || {}, null, 2)}\r
\r
JOB DESCRIPTION:\r
${data.jobDescription || ''}\r
\r
TARGET ROLE: ${data.targetRole || ''}\r
\r
ALGORITHMIC PRE-ANALYSIS:\r
${JSON.stringify(data.algorithmicResults || {}, null, 2)}\r
\r
${ragContext ? `KNOWLEDGE BASE CONTEXT (use these best practices and keyword synonyms for more accurate scoring):\r
${ragContext}\r
\r
` : ''}Score the resume on these 10 categories from 0-100. Provide one specific, actionable fix for each.\r
Use the algorithmic pre-analysis data to inform your scores where available.\r
If keyword synonyms are provided in the context, treat synonym matches as keyword matches (e.g., "CI/CD" = "continuous integration").\r
\r
You MUST respond with valid JSON in this exact format:\r
{\r
  "overall": 0,\r
  "breakdown": {\r
    "keywordMatch": { "score": 0, "fix": "specific actionable suggestion" },\r
    "formatting": { "score": 0, "fix": "" },\r
    "sectionCompleteness": { "score": 0, "fix": "" },\r
    "bulletQuality": { "score": 0, "fix": "" },\r
    "summaryStrength": { "score": 0, "fix": "" },\r
    "skillCoverage": { "score": 0, "fix": "" },\r
    "quantification": { "score": 0, "fix": "" },\r
    "actionVerbs": { "score": 0, "fix": "" },\r
    "length": { "score": 0, "fix": "" },\r
    "contactInfo": { "score": 0, "fix": "" }\r
  },\r
  "missingKeywords": ["keyword1", "keyword2"],\r
  "suggestions": ["Top priority suggestion 1", "Suggestion 2", "Suggestion 3"]\r
}`;


export const reviewerPrompt = (data, ragContext = '') => `You are a senior career counselor reviewing a resume for a ${data.targetRole || 'General'} position.\r
\r
RESUME DATA:\r
${JSON.stringify(data.sections || {}, null, 2)}\r
\r
${data.jobDescription ? `TARGET JOB DESCRIPTION:\\n${data.jobDescription}` : 'No specific job description provided.'}\r
\r
${ragContext ? `KNOWLEDGE BASE CONTEXT (use these best practices and examples as benchmarks):\r
${ragContext}\r
\r
` : ''}Provide a comprehensive review covering:\r
1. Overall impression and rating\r
2. Section-by-section feedback\r
3. Common mistakes found\r
4. Strengths to highlight\r
5. Top 3 priority improvements\r
\r
You MUST respond with valid JSON:\r
{\r
  "overallRating": "strong",\r
  "overallFeedback": "2-3 sentence overall impression",\r
  "sectionFeedback": {\r
    "personalInfo": { "rating": "strong", "feedback": "specific feedback" },\r
    "summary": { "rating": "good", "feedback": "" },\r
    "experience": { "rating": "needs-work", "feedback": "" },\r
    "education": { "rating": "good", "feedback": "" },\r
    "skills": { "rating": "strong", "feedback": "" },\r
    "projects": { "rating": "good", "feedback": "" }\r
  },\r
  "mistakes": ["Common mistake 1", "Common mistake 2"],\r
  "strengths": ["Strength 1", "Strength 2"],\r
  "priorityFixes": ["Fix 1 (highest impact)", "Fix 2", "Fix 3"]\r
}\r
\r
Valid ratings are: "strong", "good", "needs-work", "weak"`;


export const matchJobPrompt = (data, ragContext = '') => `You are an ATS expert analyzing how well a resume matches a specific job description.\r
\r
RESUME SECTIONS:\r
${JSON.stringify(data.sections || {}, null, 2)}\r
\r
JOB DESCRIPTION:\r
${data.jobDescription || ''}\r
\r
TARGET ROLE: ${data.targetRole || ''}\r
\r
${ragContext ? `KNOWLEDGE BASE CONTEXT (use keyword synonyms to identify semantic matches, not just exact string matches):\r
${ragContext}\r
\r
` : ''}Analyze the match between resume and job description. Identify:\r
1. Keywords present in JD but missing from resume\r
2. Skills gaps\r
3. Experience alignment\r
4. Specific content changes to improve match\r
5. If keyword synonyms are provided, treat them as matches (e.g., "ML" = "Machine Learning")\r
\r
You MUST respond with valid JSON:\r
{\r
  "matchScore": 0,\r
  "matchedKeywords": ["keyword1"],\r
  "missingKeywords": ["keyword1"],\r
  "contentSuggestions": [\r
    {\r
      "section": "experience",\r
      "suggestion": "Add keywords X and Y to your bullet points about Z",\r
      "priority": "high"\r
    }\r
  ],\r
  "overallFeedback": "Summary of how to improve the match"\r
}`;


export const skillGapsPrompt = (data, ragContext = '') => `Compare these resume skills against the job description and identify gaps.\r
\r
RESUME SKILLS:\r
${JSON.stringify(data.skills || {}, null, 2)}\r
\r
JOB DESCRIPTION:\r
${data.jobDescription || ''}\r
\r
${ragContext ? `KNOWLEDGE BASE CONTEXT (use skill taxonomies to identify related skills and recommend learning paths):\r
${ragContext}\r
\r
` : ''}You MUST respond with valid JSON:\r
{\r
  "requiredSkills": ["skill1", "skill2"],\r
  "presentSkills": ["skill1"],\r
  "missingSkills": ["skill2"],\r
  "recommendations": [\r
    {\r
      "skill": "skill2",\r
      "priority": "high",\r
      "suggestion": "Where and how to add this skill to the resume"\r
    }\r
  ]\r
}`;