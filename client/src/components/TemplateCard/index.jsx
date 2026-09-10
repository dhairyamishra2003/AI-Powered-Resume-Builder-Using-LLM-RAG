// ============================================
// TemplateCard/index.jsx - Template Mini-Card
// ============================================

import './index.css';
import { useRef, useState, useEffect } from 'react';
import { HiCheckCircle, HiEye, HiSparkles } from 'react-icons/hi2';

import ModernProfessionalTemplate from '../templates/ModernProfessionalTemplate.jsx';
import MinimalAtsTemplate from '../templates/MinimalAtsTemplate.jsx';
import ExecutiveCorporateTemplate from '../templates/ExecutiveCorporateTemplate.jsx';
import SoftwareEngineerTemplate from '../templates/SoftwareEngineerTemplate.jsx';
import AimlEngineerTemplate from '../templates/AimlEngineerTemplate.jsx';
import CreativeCleanTemplate from '../templates/CreativeCleanTemplate.jsx';

const BASE_SAMPLE_DATA = {
  personalInfo: {
    fullName: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 012-3456',
    location: 'San Francisco, CA',
    linkedIn: 'linkedin.com/in/alexjohnson',
    portfolio: 'alexjohnson.dev',
    targetRole: 'Senior Professional',
  },
  summary:
    'Results-driven Senior Professional with 6+ years of hands-on experience building scalable applications, distributed systems, and real-time platforms. Proven track record of improving system uptime to 99.9% and reducing latency by 45%. Passionate about clean architecture, developer velocity, and mentoring engineers.',
  experience: [
    {
      company: 'TechCorp Industries',
      role: 'Senior Software Engineer',
      startDate: '2022-03',
      endDate: '',
      current: true,
      bullets: [
        'Architected real-time event pipeline processing 15M+ daily messages with Kafka and Redis.',
        'Led migration from monolithic architecture to modular microservices, cutting deployment cycles by 60%.',
        'Optimized PostgreSQL query execution and database indexing, improving API p95 latency by 40%.',
        'Mentored 5 junior engineers and established automated code review and CI/CD quality standards.',
      ],
    },
    {
      company: 'Innovate Systems Labs',
      role: 'Software Engineer',
      startDate: '2019-06',
      endDate: '2022-02',
      current: false,
      bullets: [
        'Built enterprise analytics dashboards using React, TypeScript, and GraphQL serving 50,000+ daily active users.',
        'Engineered webhook delivery engine with exponential backoff and dead-letter queues.',
        'Reduced client bundle size by 35% through lazy loading, tree-shaking, and asset optimization.',
      ],
    },
  ],
  education: [
    {
      institution: 'Stanford University',
      degree: 'B.S.',
      field: 'Computer Science',
      startDate: '2015',
      endDate: '2019',
      gpa: '3.85',
    },
  ],
  skills: {
    technical: ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Python', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GraphQL'],
    soft: ['System Architecture', 'Agile / Scrum', 'Technical Leadership', 'Cross-functional Collaboration'],
    languages: ['English (Native)', 'Spanish (Conversational)'],
  },
  projects: [
    {
      name: 'AgentFlow AI Platform',
      description: 'Intelligent workflow execution, validation, recovery, and real-time monitoring platform',
      technologies: ['React Flow', 'Socket.IO', 'Redis', 'Node.js', 'TypeScript', 'LangGraph'],
      link: 'github.com/alex/agentflow',
      startDate: '2024-08',
      endDate: '2025-01',
      bullets: ['Scaled workflow orchestration engine to support 10,000+ concurrent state transitions with zero downtime.'],
    },
    {
      name: 'CloudMetrics Telemetry Dashboard',
      description: 'High-throughput metrics aggregator and anomaly detection engine',
      technologies: ['Go', 'Kafka', 'Prometheus', 'Docker', 'PostgreSQL'],
      link: 'github.com/alex/cloudmetrics',
      startDate: '2023-11',
      endDate: '2024-05',
      bullets: ['Processed 20M+ time-series datapoints daily with sub-second alert dispatch.'],
    },
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', date: '2023' },
    { name: 'Google Cloud Professional Cloud Architect', issuer: 'Google Cloud', date: '2022' },
  ],
};

const TEMPLATE_SAMPLE_DATA = {
  'modern-professional': {
    ...BASE_SAMPLE_DATA,
    personalInfo: { ...BASE_SAMPLE_DATA.personalInfo, targetRole: 'Senior Full-Stack Engineer & Tech Lead' },
  },
  'minimal-ats': {
    ...BASE_SAMPLE_DATA,
    personalInfo: { ...BASE_SAMPLE_DATA.personalInfo, targetRole: 'Staff Software Engineer' },
  },
  'executive-corporate': {
    ...BASE_SAMPLE_DATA,
    personalInfo: { fullName: 'Alexandra Vance', email: 'alexandra.vance@exec.com', phone: '+1 (555) 890-1234', location: 'New York, NY', linkedIn: 'linkedin.com/in/alexandravance', portfolio: 'alexandravance.com', targetRole: 'VP of Engineering / CTO' },
    summary: 'Executive Technology Leader with 12+ years directing global engineering teams, managing $20M+ budgets, and scaling distributed platforms from series B through IPO.',
    skills: {
      technical: ['Enterprise Architecture', 'Cloud Governance', 'DevOps Strategy', 'Platform Engineering', 'Disaster Recovery'],
      soft: ['Executive Leadership', 'P&L Management', 'M&A Due Diligence', 'Global Team Hiring'],
      languages: ['English (Native)', 'French (Fluent)'],
    },
  },
  'software-engineer': {
    ...BASE_SAMPLE_DATA,
    personalInfo: { fullName: 'David Miller', email: 'david.miller@dev.io', phone: '+1 (555) 456-7890', location: 'Austin, TX', linkedIn: 'linkedin.com/in/davidmiller-dev', portfolio: 'github.com/davidmiller', targetRole: 'Lead Software Engineer' },
  },
  'aiml-engineer': {
    ...BASE_SAMPLE_DATA,
    personalInfo: { fullName: 'Dr. Marcus Chen', email: 'm.chen@ai-labs.org', phone: '+1 (555) 789-0123', location: 'Seattle, WA', linkedIn: 'linkedin.com/in/marcuschen-ai', portfolio: 'github.com/marcuschen-ai', targetRole: 'Senior AI / ML Research Engineer' },
    summary: 'Machine Learning Engineer specializing in Generative AI, Large Language Models (LLMs), RAG pipelines, fine-tuning PyTorch models, and scalable MLOps infrastructure processing 50M+ vector embeddings.',
    skills: {
      technical: ['PyTorch', 'TensorFlow', 'LLMs', 'RAG Pipelines', 'LangChain', 'LangGraph', 'Qdrant', 'Hugging Face', 'CUDA', 'Python', 'MLOps', 'FastAPI'],
      soft: ['Research & Innovation', 'Technical Writing', 'Experiment Design'],
      languages: ['English (Native)', 'Mandarin (Professional)'],
    },
    projects: [
      {
        name: 'OmniRAG Knowledge Synthesis Engine',
        description: 'Multi-agent vector retrieval and contextual synthesis platform',
        technologies: ['PyTorch', 'LangGraph', 'Qdrant', 'FastAPI', 'Docker', 'Google Gemini'],
        link: 'github.com/marcuschen-ai/omnirag',
        startDate: '2024-06',
        endDate: '2024-12',
        bullets: ['Implemented reciprocal rank fusion (RRF) and hybrid semantic search across 5M+ technical research papers.'],
      },
      {
        name: 'VisionQC Automated Quality Pipeline',
        description: 'CNN and Vision Transformer model for real-time defect detection',
        technologies: ['PyTorch', 'OpenCV', 'TensorRT', 'CUDA', 'Python'],
        link: 'github.com/marcuschen-ai/visionqc',
        startDate: '2023-09',
        endDate: '2024-04',
        bullets: ['Achieved 99.2% defect classification accuracy while maintaining <15ms inference latency.'],
      },
    ],
  },
  'creative-clean': {
    ...BASE_SAMPLE_DATA,
    personalInfo: { fullName: 'Sophia Martinez', email: 'sophia@designcraft.studio', phone: '+1 (555) 234-5678', location: 'Los Angeles, CA', linkedIn: 'linkedin.com/in/sophiamartinez-design', portfolio: 'sophiadesign.io', targetRole: 'Lead Product Designer & Design Engineer' },
    summary: 'Design Engineer & Product Lead bridging UX design and frontend engineering. 6+ years designing accessible, human-centered digital experiences and design systems used by millions.',
    skills: {
      technical: ['Design Systems', 'Figma', 'React', 'CSS Architecture', 'Prototyping', 'User Research', 'Accessibility (WCAG)'],
      soft: ['Creative Direction', 'Storytelling', 'Design Thinking'],
      languages: ['English (Native)', 'Italian (Conversational)'],
    },
  },
};

const templateComponents = {
  'modern-professional': ModernProfessionalTemplate,
  'minimal-ats': MinimalAtsTemplate,
  'executive-corporate': ExecutiveCorporateTemplate,
  'software-engineer': SoftwareEngineerTemplate,
  'aiml-engineer': AimlEngineerTemplate,
  'creative-clean': CreativeCleanTemplate,
};

function TemplateCard({ template, isActive, onSelect, density = 'gallery' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.42);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) setScale(w / 794);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const key = template.layout || template.id;
  const TemplateComponent = templateComponents[key] || ModernProfessionalTemplate;
  const sampleData = TEMPLATE_SAMPLE_DATA[key] || BASE_SAMPLE_DATA;
  const categoryLabel = (template.category || 'professional').replace('-', ' ');

  return (
    <button type="button" onClick={onSelect} className={`template-card template-card--${density}`}>
      <div className={`template-card__shell ${isActive ? 'template-card__shell--active' : ''}`}>
        <div className="template-card__topline" style={{ background: `linear-gradient(90deg, ${template.colors.primary}, ${template.colors.accent})` }} />
        <div className="template-card__header">
          <div>
            <p className="template-card__category">{categoryLabel}</p>
            <h3 className="template-card__name">{template.name}</h3>
          </div>
          <span className="template-card__icon" aria-hidden="true">
            <HiSparkles />
          </span>
        </div>
        <div className="template-card__preview-frame" ref={containerRef}>
          <div className="template-card__preview-stage" style={{ width: 794 * scale, height: 1123 * scale }}>
            <div className={`template-card__page ${isActive ? 'template-card__page--selected' : ''}`} style={{ transform: `scale(${scale})` }}>
              <TemplateComponent sections={sampleData} colors={template.colors} isPreview={true} />
            </div>
            <div className="template-card__overlay">
              <span><HiEye /> Preview</span>
            </div>
            {isActive && (
              <div className="template-card__check">
                <HiCheckCircle />
              </div>
            )}
          </div>
        </div>
        <p className="template-card__description">{template.description}</p>
      </div>
    </button>
  );
}

export { BASE_SAMPLE_DATA as SAMPLE_DATA, TEMPLATE_SAMPLE_DATA };
export default TemplateCard;
