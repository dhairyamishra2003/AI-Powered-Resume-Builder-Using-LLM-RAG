export const resumeParserPrompt = (resumeText) => `You are an expert resume parser. Extract structured data from this resume text.\r

CRITICAL INSTRUCTIONS FOR EXACT CONTENT PRESERVATION:
1. Preserve the original resume content WORD-FOR-WORD. Extract all sentences, bullet points, titles, and descriptions EXACTLY as written in the text.
2. Do NOT paraphrase, rewrite, summarize, or alter the user's original wording under any circumstances.
3. Do NOT invent missing information, and do NOT generate replacement or filler text.
4. Do NOT repeat or duplicate any sentence, bullet point, skill, or section.
5. Preserve the EXACT number of bullet points and entries present in the resume text.
6. If an item or section is not present in the text, leave it as an empty string or empty array.
7. ZERO-MISSING-SKILLS REQUIREMENT: Extract EVERY single technical skill, tool, programming language, framework, database, library, platform, cloud technology, AI/ML skill, and software mentioned anywhere in the resume text (in Skills section, Summary, Experience, Projects, or Certifications).
- Do NOT skip, omit, or truncate any skill.
- Preserve the exact original skill labels and versions (e.g. both HTML and HTML5, CSS and CSS3, React and React.js, Express and Express.js, Tailwind and Tailwind CSS, REST API and REST APIs if both appear).
- Return all technical skills in the "skills.technical" array without any length limit or truncation.
8. COMPLETE LANGUAGES EXTRACTION: Extract EVERY human/spoken language mentioned anywhere in the resume text (e.g., in a Languages section, Skills, or Profile) into the "skills.languages" array (e.g. ["English", "Hindi", "Spanish", "German"]). If no spoken languages are mentioned in the resume, leave "skills.languages" as an empty array []. Never omit user-specified languages.
Never invent, infer, embellish, or fill in information that is not explicitly present. Preserve facts and all distinct entries. Use empty strings or arrays for missing values.\r
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
    "portfolio": "",\r
    "github": ""\r
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
  "projects": [\r
    {\r
      "name": "Project Name",\r
      "description": "Project overview and details",\r
      "technologies": ["tech1", "tech2"],\r
      "link": "",\r
      "bullets": ["bullet point 1", "bullet point 2"]\r
    }\r
  ],\r
  "certifications": [\r
    {\r
      "name": "Certification Name",\r
      "issuer": "Issuing Organization",\r
      "date": "YYYY-MM",\r
      "link": ""\r
    }\r
  ],\r
  "publications": [\r
    {\r
      "title": "Publication / Research Paper Title",\r
      "publisher": "Journal / Conference / Venue / Independent Research",\r
      "authors": "Author Name(s)",\r
      "date": "YYYY or YYYY-MM",\r
      "link": "",\r
      "description": "Abstract, research methodology, key findings or contribution"\r
    }\r
  ]\r
}\r
\r
Extract only information actually present. For projects, return an array of project objects with name, description, technologies, link, and bullets. Normalize dates to YYYY-MM only when the source supplies enough date information; otherwise preserve the available text. If information is missing, leave it as an empty string or empty array. Respond ONLY with valid JSON.`;

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


export const atsScorerPrompt = (data, ragContext = '') => `You are an ATS (Applicant Tracking System) expert reviewing a resume against a job description.\r
\r
RESUME SECTIONS:\r
${JSON.stringify(data.sections || {}, null, 2)}\r
\r
JOB DESCRIPTION:\r
${data.jobDescription || ''}\r
\r
TARGET ROLE: ${data.targetRole || ''}\r
\r
${ragContext ? `KNOWLEDGE BASE CONTEXT (use keyword synonyms and best practices to improve your analysis):\r
${ragContext}\r
\r
` : ''}Your task is to provide QUALITATIVE analysis only. Do NOT output any numeric scores.\r
The numeric scoring is handled separately by the backend — your job is to identify keywords, skills, and improvements.\r
\r
STRICT RULES — you MUST follow these exactly:\r
1. matchedKeywords: ONLY keywords that literally appear in the Job Description above.\r
2. missingKeywords: ONLY keywords from the Job Description that are absent from the resume. Do NOT add generic keywords not present in the JD.\r
3. matchedSkills: ONLY technical skills, tools, frameworks, or technologies explicitly mentioned in the Job Description text.\r
4. missingSkills: ONLY skills explicitly in the JD that are missing from the resume. Do NOT hallucinate skills like "Cloud Infrastructure", "Testing/QA", or anything not written in the JD.\r
5. suggestions: Give 3 actionable improvements based solely on the resume vs this specific JD. Reference actual JD content.\r
6. breakdown.fix: Each fix must be specific to THIS resume and THIS JD. Do not give generic advice.\r
\r
You MUST respond with valid JSON in this EXACT format — no numeric scores, only strings:\r
{\r
  "matchedKeywords": ["keyword1", "keyword2"],\r
  "missingKeywords": ["keyword3", "keyword4"],\r
  "matchedSkills": ["skill1", "skill2"],\r
  "missingSkills": ["skill3", "skill4"],\r
  "suggestions": ["Specific improvement 1 based on this JD", "Improvement 2", "Improvement 3"],\r
  "breakdown": {\r
    "keywordMatch":        { "fix": "one specific actionable suggestion for this metric" },\r
    "bulletQuality":       { "fix": "" },\r
    "formatting":          { "fix": "" },\r
    "sectionCompleteness": { "fix": "" },\r
    "summaryStrength":     { "fix": "" },\r
    "skillCoverage":       { "fix": "" },\r
    "quantification":      { "fix": "" },\r
    "actionVerbs":         { "fix": "" },\r
    "length":              { "fix": "" },\r
    "contactInfo":         { "fix": "" }\r
  }\r
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
