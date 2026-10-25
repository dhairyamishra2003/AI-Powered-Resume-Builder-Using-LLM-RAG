// ============================================
// placeholderData.js - Template Preview Data
// ============================================
// Provides rich sample data so templates always
// appear fully populated in the preview, even
// when the user has not filled in their resume yet.
// ============================================

export const PLACEHOLDER_SECTIONS = {
  personalInfo: {
    fullName: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 012-3456',
    location: 'San Francisco, CA',
    linkedIn: 'linkedin.com/in/alexjohnson',
    portfolio: 'alexjohnson.dev',
    targetRole: 'Senior Software Engineer',
  },
  summary:
    'Results-driven Software Engineer with 5+ years of experience building scalable web applications and distributed systems. Proven track record of reducing latency by 40% and improving system reliability to 99.9% uptime. Passionate about clean code, mentoring junior developers, and delivering impactful products.',
  experience: [
    {
      role: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      startDate: '2022-03',
      endDate: '',
      current: true,
      bullets: [
        'Led migration of monolithic API to microservices, reducing deployment time by 60% across 8 services.',
        'Architected real-time data pipeline processing 2M+ events/day using Kafka and Node.js.',
        'Mentored 4 junior engineers through code reviews, pair programming, and weekly 1:1s.',
        'Reduced page load time by 45% through lazy loading, CDN optimization, and code splitting.',
      ],
    },
    {
      role: 'Software Engineer',
      company: 'StartupXYZ',
      startDate: '2020-06',
      endDate: '2022-02',
      current: false,
      bullets: [
        'Built React dashboard serving 50,000+ daily active users with real-time analytics.',
        'Implemented CI/CD pipeline using GitHub Actions, cutting release cycles from 2 weeks to 2 days.',
        'Designed PostgreSQL schema for multi-tenant SaaS platform handling 10TB of data.',
      ],
    },
  ],
  education: [
    {
      institution: 'University of California, Berkeley',
      degree: 'B.S.',
      field: 'Computer Science',
      startDate: '2016-08',
      endDate: '2020-05',
      gpa: '3.8',
    },
  ],
  skills: {
    technical: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'GraphQL'],
    soft: ['Problem Solving', 'Team Leadership', 'Agile/Scrum', 'Technical Mentoring', 'Cross-functional Collaboration'],
    languages: ['English (Native)', 'Spanish (Conversational)'],
  },
  projects: [
    {
      name: 'AgentFlow AI Operations Platform',
      description: 'Intelligent workflow execution, validation, recovery, and real-time monitoring',
      technologies: ['React Flow', 'Socket.IO', 'Redis', 'BullMQ', 'Node.js', 'LangGraph'],
      link: 'github.com/alexj/agentflow',
      startDate: '2024-08',
      endDate: '2025-01',
      bullets: [
        'Gained 1,200+ GitHub stars and used by 300+ engineering teams.',
        'Supports 15+ data sources including Prometheus, Grafana, and Datadog.',
      ],
    },
    {
      name: 'AI-Powered Resume Platform',
      description: 'Full-stack platform using LLMs, RAG, NLP, and semantic search',
      technologies: ['React', 'Node.js', 'MongoDB', 'LangChain', 'Gemini API'],
      link: 'github.com/alexj/resumeai',
      startDate: '2024-01',
      endDate: '2024-06',
      bullets: [
        'Built with multi-agent architecture and automated ATS score analysis.',
        'Used by 3,000+ job seekers in first month post-launch.',
      ],
    },
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', date: '2023' },
    { name: 'Google Professional Cloud Developer', issuer: 'Google Cloud', date: '2022' },
  ],
};

/**
 * Checks if the resume has any actual user content.
 */
export function hasAnyUserData(sections) {
  if (!sections) return false;
  const p = sections.personalInfo;
  if (p && (p.fullName?.trim() || p.email?.trim() || p.phone?.trim() || p.location?.trim() || p.targetRole?.trim())) return true;
  if (typeof sections.summary === 'string' && sections.summary.trim()) return true;
  if (Array.isArray(sections.experience) && sections.experience.some((e) => e.role || e.company)) return true;
  if (Array.isArray(sections.education) && sections.education.some((e) => e.degree || e.institution)) return true;
  if (Array.isArray(sections.projects) && sections.projects.some((pr) => pr.name)) return true;
  if (Array.isArray(sections.certifications) && sections.certifications.some((c) => c.name)) return true;
  const s = sections.skills;
  if (s) {
    if (Array.isArray(s.technical) && s.technical.length > 0) return true;
    if (Array.isArray(s.soft) && s.soft.length > 0) return true;
    if (Array.isArray(s.languages) && s.languages.length > 0) return true;
  }
  return false;
}

/**
 * Returns a section's value if it has meaningful content,
 * otherwise returns the placeholder ONLY if the whole resume is blank.
 */
/**
 * Returns a section's value.
 * Placeholder/sample data is ONLY returned when isPreview is explicitly true
 * (e.g. for template gallery / preview cards). Real user resumes NEVER display
 * fake sample data (Alex Johnson, sample skills, etc.).
 */
export function withPlaceholder(sectionName, value, sections = null, isPreview = false) {
  const ph = PLACEHOLDER_SECTIONS[sectionName];

  // If in template gallery preview mode and no value provided, use placeholder
  if (isPreview) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (sectionName === 'personalInfo' && (value.fullName || value.email || value.phone)) {
        return value;
      }
      if (sectionName === 'skills' && (value.technical?.length || value.soft?.length)) {
        return value;
      }
    } else if (Array.isArray(value) && value.length > 0) {
      return value;
    } else if (typeof value === 'string' && value.trim()) {
      return value;
    }
    return ph;
  }

  // Real user resume mode: NEVER show fake data
  if (sectionName === 'personalInfo') {
    const val = value || {};
    return {
      fullName: val.fullName || '',
      email: val.email || '',
      phone: val.phone || '',
      location: val.location || '',
      linkedIn: val.linkedIn || '',
      portfolio: val.portfolio || '',
      targetRole: val.targetRole || '',
    };
  }

  if (sectionName === 'summary') {
    return (typeof value === 'string') ? value : '';
  }

  if (['experience', 'education', 'projects', 'certifications'].includes(sectionName)) {
    return Array.isArray(value) ? value : [];
  }

  if (sectionName === 'skills') {
    const val = value || {};
    const rawSoft = val.soft || val.coreStrengths || val.softSkills || val.strengths || [];
    const rawTech = val.technical || val.tech || [];
    const rawLang = val.languages || val.spokenLanguages || [];
    return {
      technical: Array.isArray(rawTech) ? rawTech : [],
      soft: Array.isArray(rawSoft) ? rawSoft : [],
      languages: Array.isArray(rawLang) ? rawLang : [],
    };
  }

  return value || null;
}
