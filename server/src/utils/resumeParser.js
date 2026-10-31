import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const extractTextFromPdf = async (buffer) => {
  if (!buffer || (Buffer.isBuffer(buffer) && buffer.length === 0)) {
    throw new Error('PDF file buffer is empty or missing.');
  }
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocument({
    data: uint8Array,
    useSystemFonts: true,
  }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // pdfjs exposes text as individually positioned fragments. Joining every
    // fragment with spaces turns a whole page into one line, which makes a
    // section-based parser unable to distinguish Skills from Experience, etc.
    // Rebuild visual rows first so both the deterministic parser and the AI
    // receive the same section boundaries a reader sees in the document.
    const rows = [];
    for (const item of content.items) {
      const value = String(item.str || '').trim();
      if (!value) continue;
      const y = item.transform?.[5] ?? 0;
      const x = item.transform?.[4] ?? 0;
      const row = rows.find((candidate) => Math.abs(candidate.y - y) < 3);
      if (row) row.items.push({ value, x });
      else rows.push({ y, items: [{ value, x }] });
    }
    const pageText = rows
      .sort((a, b) => b.y - a.y)
      .map((row) => row.items.sort((a, b) => a.x - b.x).map((item) => item.value).join(' '))
      .join('\n');
    fullText += pageText + '\n';
  }
  return fullText.trim();
};

export const escapeRegExp = (str = '') => {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const fixKerning = (str = '') => {
  return String(str || '')
    .replace(/\b([A-Z])\s+([a-zA-Z]{2,})\b/g, '$1$2')
    .replace(/\b([A-Z][a-z]+)\s+([a-z]{2,})\b/g, (m, p1, p2) => {
      const combined = p1 + p2;
      if (/^(?:Problem|Team|English|Hindi|Automation|Agents|Recruiter|Developed|Screening|Engineering|Learning|Database|Presentation)\b/i.test(combined)) return combined;
      return m;
    });
};

export const extractFallbackSections = (text = '') => {
  const cleanText = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText.split('\n').map((l) => fixKerning(l.trim())).filter(Boolean);

  // 1. Personal Info
  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = cleanText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}/);
  const linkedInMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const portfolioMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:dev|me|io|app|portfolio|site)/i);

  let fullName = '';
  let targetRole = '';
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (
      !fullName &&
      line.length >= 2 &&
      line.length < 50 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/\d{5,}/.test(line) &&
      !/^(resume|curriculum|vitae|cv|page|profile)$/i.test(line)
    ) {
      fullName = line.replace(/^[•\-\*\|\s]+|[•\-\*\|\s]+$/g, '');
      continue;
    }
    if (fullName && !targetRole && line.length < 120 && !line.includes('@') && !line.includes('http')) {
      if (/developer|engineer|manager|lead|architect|consultant|analyst|designer|officer|specialist/i.test(line)) {
        targetRole = line.replace(/^[•\-\*\|\s]+|[•\-\*\|\s]+$/g, '');
      }
    }
  }

  // Location detection: e.g. "City, State", "City, Country"
  let location = '';
  const locMatch = cleanText.match(/\b([A-Z][a-zA-Z\s]{2,20},\s*(?:[A-Z]{2}|[A-Z][a-zA-Z\s]{2,20}))\b/);
  if (locMatch && !locMatch[1].includes('University') && !locMatch[1].includes('College')) {
    location = locMatch[1].trim();
  }

  // 2. Identify Section Blocks with precise boundaries
  const SECTION_HEADERS = [
    { type: 'summary', regex: /^(?:professional\s+summary|executive\s+summary|career\s+summary|summary|about\s+me|about|profile|objective)$/i },
    { type: 'experience', regex: /^(?:work\s+experience|professional\s+experience|employment\s+history|experience|internships?|work\s+history)$/i },
    { type: 'education', regex: /^(?:education|academic\s+background|academics|qualifications|educational\s+qualifications)$/i },
    { type: 'softSkills', regex: /^(?:soft\s+skills|interpersonal\s+skills|people\s+skills|professional\s+skills|core\s+strengths|core\s+competencies|strengths)$/i },
    { type: 'skills', regex: /^(?:technical\s+skills|technical\s+competencies|skills\s*&?\s*competencies|skills|technologies|tools\s*&?\s*technologies)$/i },
    { type: 'projects', regex: /^(?:key\s+projects|technical\s+projects|academic\s+projects|personal\s+projects|projects|strategic\s+initiatives)$/i },
    { type: 'certifications', regex: /^(?:certifications?|certificates?|licenses?\s*&?\s*certifications?|credentials?\s*&?\s*honors?|honors?\s*&?\s*awards?)$/i },
    { type: 'publications', regex: /^(?:publications?|research\s+papers?|research\s+publications?|research\s+work|research\s+projects?|research|papers?|scholarly\s+work|patents?\s*&?\s*publications?)$/i },
    { type: 'languages', regex: /^(?:languages?|known\s+languages?)$/i },
    { type: 'achievements', regex: /^(?:achievements?|key\s+achievements?|awards?\s*&?\s*achievements?|honors?\s*&?\s*achievements?)$/i },
  ];

  const sectionIndices = [];
  lines.forEach((line, index) => {
    if (line.length < 38 && !line.includes('@') && !line.includes('http') && !/[-–—|:]/.test(line)) {
      const cleanH = line.replace(/[^a-zA-Z\s]/g, '').trim();
      for (const sh of SECTION_HEADERS) {
        if (sh.regex.test(cleanH)) {
          sectionIndices.push({ type: sh.type, index, line });
          break;
        }
      }
    }
  });

  const getSectionLines = (type) => {
    const foundIdx = sectionIndices.findIndex((s) => s.type === type);
    if (foundIdx === -1) return [];
    const startLine = sectionIndices[foundIdx].index + 1;
    const endLine = foundIdx + 1 < sectionIndices.length ? sectionIndices[foundIdx + 1].index : lines.length;
    return lines.slice(startLine, endLine);
  };

  // 3. Summary
  const summaryLines = getSectionLines('summary');
  let summary = '';
  if (summaryLines.length > 0) {
    summary = summaryLines.join(' ').slice(0, 1000);
  } else {
    const topCandidates = lines.slice(1, 8).filter((l) => l.length > 35 && !l.includes('@') && !l.includes('http'));
    summary = topCandidates.join(' ').slice(0, 450);
  }

  // 4. Skills extraction
  const skillLines = getSectionLines('skills');
  const COMMON_TECH = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'HTML5', 'HTML', 'CSS3', 'CSS',
    'React', 'React.js', 'Next.js', 'Vue', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
    'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'GraphQL', 'REST API', 'REST APIs', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Git', 'GitHub', 'Linux', 'Tailwind', 'Tailwind CSS', 'CI/CD', 'LangChain', 'LangGraph',
    'Generative AI', 'Agentic AI', 'RAG', 'LLMs', 'NLP', 'Machine Learning', 'Deep Learning', 'Computer Vision', 'PyTorch', 'TensorFlow',
    'Power BI', 'Tableau', 'Excel', 'Make.com', 'Automation', 'Jupyter', 'VS Code', 'Qdrant', 'Groq', 'React Flow', 'Socket.IO', 'BullMQ'
  ];

  const matchedTech = COMMON_TECH.filter((tech) => {
    try {
      const escaped = escapeRegExp(tech);
      return new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:[^a-zA-Z0-9]|$)`, 'i').test(cleanText);
    } catch {
      return false;
    }
  });

  const extractedFromSkillSection = [];
  skillLines.forEach((sl) => {
    const cleaned = sl.replace(/^[•\-\*·▪\s]+/, '').replace(/^[^:\-–—|]+[:\-–—]\s*/, '');
    cleaned.split(/[,;•|/·\t\n]+/).forEach((item) => {
      const trimmed = item.trim();
      if (trimmed.length > 1 && trimmed.length < 60 && !extractedFromSkillSection.includes(trimmed)) {
        extractedFromSkillSection.push(trimmed);
      }
    });
  });

  const finalTechSkills = Array.from(new Set([...matchedTech, ...extractedFromSkillSection]));

  // Soft Skills extraction
  const softSkillLines = getSectionLines('softSkills');
  const extractedSoftSkills = [];
  softSkillLines.forEach((sl) => {
    const cleaned = sl.replace(/^[•\-\*·▪\s]+/, '').replace(/^[^:]+:\s*/, '').trim();
    if (!cleaned || /^(?:soft\s+skills|core\s+strengths|interpersonal\s+skills|competencies)$/i.test(cleaned)) return;
    cleaned.split(/[,•|/·\t\n]+/).forEach((item) => {
      const trimmed = item.trim();
      if (trimmed.length > 2 && trimmed.length < 50 && !extractedSoftSkills.includes(trimmed)) {
        extractedSoftSkills.push(trimmed);
      }
    });
  });

  const KNOWN_SOFT_SKILLS = [
    'Strategic Leadership', 'Problem Solving', 'Team Collaboration', 'Cross-functional Communication',
    'System Architecture', 'Agile & Scrum Delivery', 'Critical Thinking', 'Time Management',
    'Analytical Thinking', 'Adaptability', 'Mentoring', 'Quick Learner', 'Communication'
  ];

  const matchedSoft = KNOWN_SOFT_SKILLS.filter((s) => {
    try {
      const escaped = escapeRegExp(s);
      return new RegExp(`\\b${escaped}\\b`, 'i').test(cleanText);
    } catch {
      return false;
    }
  });

  const softSkills = Array.from(new Set([...extractedSoftSkills, ...matchedSoft])).slice(0, 15);

  // 5. Experience Extraction
  const expLines = getSectionLines('experience');
  const experience = [];
  let currentExp = null;
  const prevExpLines = [];
  const dateRangeRegex = /(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(\d{4})\s*(?:[-–—to]+\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(\d{4}|Present|Current))?/i;
  const ROLE_KEYWORDS = /\b(?:engineer|developer|intern|internship|manager|lead|architect|consultant|analyst|specialist|officer|designer|administrator|director|associate|scientist|researcher)\b/i;
  const MONTH_MAP = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const parseMonthYear = (monthStr, yearStr) => {
    if (!yearStr) return '';
    const m = monthStr ? MONTH_MAP[monthStr.toLowerCase().slice(0, 3)] : '01';
    return `${yearStr}-${m || '01'}`;
  };

  expLines.forEach((line) => {
    const isBullet = /^[•\-\*·▪]\s*/.test(line);
    const dateMatch = line.match(dateRangeRegex);

    if (dateMatch && !isBullet && line.length < 100) {
      if (currentExp && (currentExp.company || currentExp.role)) {
        experience.push(currentExp);
      }
      const rawDate = dateMatch[0];
      const withoutDate = line.replace(rawDate, '').replace(/^[•\-\*\|\s,]+|[•\-\*\|\s,]+$/g, '').trim();

      let role = '';
      let company = '';

      if (withoutDate) {
        const parts = withoutDate.split(/[-–—|•,]/).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          if (ROLE_KEYWORDS.test(parts[0]) && !ROLE_KEYWORDS.test(parts[1])) {
            role = parts[0]; company = parts[1];
          } else if (ROLE_KEYWORDS.test(parts[1]) && !ROLE_KEYWORDS.test(parts[0])) {
            role = parts[1]; company = parts[0];
          } else {
            role = parts[0]; company = parts[1];
          }
        } else {
          role = parts[0] || 'Professional Role';
          company = prevExpLines.length > 0 ? prevExpLines[prevExpLines.length - 1] : parts[0] || 'Company';
        }
      } else if (prevExpLines.length >= 2) {
        const lineA = prevExpLines[prevExpLines.length - 2];
        const lineB = prevExpLines[prevExpLines.length - 1];
        if (ROLE_KEYWORDS.test(lineB) && !ROLE_KEYWORDS.test(lineA)) {
          role = lineB; company = lineA;
        } else if (ROLE_KEYWORDS.test(lineA) && !ROLE_KEYWORDS.test(lineB)) {
          role = lineA; company = lineB;
        } else {
          company = lineA; role = lineB;
        }
      } else if (prevExpLines.length === 1) {
        const parts = prevExpLines[0].split(/[-–—|•,]/).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          if (ROLE_KEYWORDS.test(parts[0]) && !ROLE_KEYWORDS.test(parts[1])) {
            role = parts[0]; company = parts[1];
          } else if (ROLE_KEYWORDS.test(parts[1]) && !ROLE_KEYWORDS.test(parts[0])) {
            role = parts[1]; company = parts[0];
          } else {
            role = parts[0]; company = parts[1];
          }
        } else {
          role = parts[0] || 'Professional Role';
          company = parts[0] || 'Company';
        }
      }

      const isCurrent = /present|current/i.test(rawDate);
      const startYear = dateMatch[2] || '';
      const startMonth = dateMatch[1] || '';
      const endYear = isCurrent ? '' : (dateMatch[4] || '');
      const endMonth = isCurrent ? '' : (dateMatch[3] || '');

      currentExp = {
        role: role || 'Professional Role',
        company: company || 'Company',
        startDate: parseMonthYear(startMonth, startYear),
        endDate: isCurrent ? '' : parseMonthYear(endMonth, endYear),
        current: isCurrent,
        bullets: [],
      };
      prevExpLines.length = 0;
    } else if (isBullet && currentExp) {
      const cleanBullet = line.replace(/^[•\-\*·▪\s]+/, '').trim();
      if (cleanBullet.length > 5) {
        currentExp.bullets.push(cleanBullet);
      }
    } else if (currentExp && line.length > 15 && !dateMatch) {
      const clean = line.replace(/^[•\-\*·▪\s]+/, '').trim();
      if (currentExp.bullets.length > 0 && !clean.endsWith('.')) {
        const lastIdx = currentExp.bullets.length - 1;
        if (!currentExp.bullets[lastIdx].endsWith('.')) {
          currentExp.bullets[lastIdx] = `${currentExp.bullets[lastIdx]} ${clean}`;
        } else {
          currentExp.bullets.push(clean);
        }
      } else {
        currentExp.bullets.push(clean);
      }
    } else if (!currentExp) {
      prevExpLines.push(line);
      if (prevExpLines.length > 2) prevExpLines.shift();
    }
  });
  if (currentExp && (currentExp.company || currentExp.role)) {
    experience.push(currentExp);
  }

  // 6. Education Extraction
  const eduLines = getSectionLines('education');
  const education = [];
  let currentEdu = null;
  const degreeKeywords = /\b(?:B\.?Tech|B\.?E\.?|B\.?S\.?|B\.?Sc|B\.?A\.?|BCA|MCA|BBA|MBA|Bachelor(?:'s)?|M\.?Tech|M\.?S\.?|M\.?Sc|Master(?:'s)?|Ph\.?D|Doctorate|Diploma|Associate(?:'s)?|High\s+School|Secondary)\b/i;

  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i];
    if (/^relevant\s+coursework/i.test(line) || /^coursework/i.test(line)) continue;

    const hasDegree = degreeKeywords.test(line);
    const dateMatch = line.match(/\b(20\d{2}|19\d{2})\b/);
    const gpaMatch = line.match(/\b(?:CGPA|GPA)[:\s]*([0-9.]+)(?:\s*\/\s*[0-9.]+)?/i);

    if (hasDegree) {
      if (currentEdu) education.push(currentEdu);
      const parts = line.split(/\s*[-–—|,]\s*/);
      currentEdu = {
        degree: parts[0] || 'Bachelor of Technology',
        field: parts.slice(1).join(', ') || 'Engineering',
        institution: '',
        startDate: '',
        endDate: dateMatch ? dateMatch[1] : '',
        gpa: gpaMatch ? gpaMatch[1] : '',
      };
      continue;
    }

    if (/university|college|institute|academy|school/i.test(line)) {
      if (!currentEdu) {
        currentEdu = { degree: 'Education', field: '', institution: line, startDate: '', endDate: '', gpa: '' };
      } else if (!currentEdu.institution) {
        const parts = line.split(/\s*\|\s*/);
        currentEdu.institution = parts[0].trim();
        if (parts[1] && !currentEdu.endDate) {
          const m = parts[1].match(/(?:20\d{2}|19\d{2})/g);
          if (m && m[1]) currentEdu.endDate = m[1];
          else if (m && m[0]) currentEdu.endDate = m[0];
        }
      } else {
        education.push(currentEdu);
        currentEdu = { degree: 'Certificate / Coursework', field: '', institution: line, startDate: '', endDate: '', gpa: '' };
      }
      continue;
    }

    if (currentEdu) {
      if (gpaMatch && !currentEdu.gpa) currentEdu.gpa = gpaMatch[1];
      if (dateMatch && !currentEdu.endDate) currentEdu.endDate = dateMatch[1];
      if (/artificial\s+intelligence|software|computer|data|engineering/i.test(line) && !currentEdu.field) {
        const parts = line.split(/\s*\|\s*/);
        currentEdu.field = parts[0].trim();
        if (parts[1] && !currentEdu.endDate) {
          const m = parts[1].match(/(?:20\d{2}|19\d{2}|Present)/g);
          if (m) currentEdu.endDate = m[m.length - 1];
        }
      }
    }
  }
  if (currentEdu) education.push(currentEdu);

  // 7. Projects Extraction with full bullet and tech preservation
  const projLines = getSectionLines('projects');
  const projects = [];
  let currentProj = null;
  let currentBullet = '';

  const finalizeBullet = () => {
    if (currentProj && currentBullet.trim()) {
      currentProj.bullets.push(currentBullet.trim());
      currentBullet = '';
    }
  };

  for (let i = 0; i < projLines.length; i++) {
    const line = projLines[i];
    const isTechLine = /^(?:technologies|tech\s*stack|tools|built\s+with|stack)\s*[:\-–—]/i.test(line);
    const isLinkLine = /^(?:github|link|url|repo|website|demo|live)\s*[:\-–—]\s*(.+)$/i.test(line) || /github\.com\//i.test(line);
    const isBulletPrefix = /^[•\-\*·▪]\s*/.test(line);

    const nextLine = projLines[i + 1] || '';
    const nextIsTech = /^(?:technologies|tech\s*stack|tools|built\s+with|stack)\s*[:\-–—]/i.test(nextLine);

    if (nextIsTech) {
      finalizeBullet();
      if (currentProj) projects.push(currentProj);
      currentProj = {
        name: line,
        technologies: [],
        link: '',
        bullets: [],
        description: '',
      };
      continue;
    }

    if (!currentProj) continue;

    if (isLinkLine) {
      finalizeBullet();
      const match = line.match(/(?:github\.com\/[^\s]+|https?:\/\/[^\s]+)/i);
      if (match) currentProj.link = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
      continue;
    }

    if (isTechLine) {
      finalizeBullet();
      const cleaned = line.replace(/^(?:technologies|tech\s*stack|tools|built\s+with|stack)\s*[:\-–—]\s*/i, '');
      const techs = cleaned.split(/[,|;·•\t]+/).map((t) => t.trim()).filter((t) => t.length > 1);
      currentProj.technologies.push(...techs);
      while (
        i + 1 < projLines.length &&
        !/^(?:designed|engineered|implemented|developed|built|created|spearheaded|trained|fine-tuned|studied|analyzed|evaluated|github)/i.test(projLines[i + 1]) &&
        !projLines[i + 1].includes('–') &&
        (projLines[i].endsWith(',') || projLines[i + 1].includes(','))
      ) {
        i++;
        const nextTechs = projLines[i].split(/[,|;·•\t]+/).map((t) => t.trim()).filter((t) => t.length > 1);
        currentProj.technologies.push(...nextTechs);
      }
      continue;
    }

    const cleanLine = line.replace(/^[•\-\*·▪\s]+/, '').trim();
    if (
      /^[A-Z][a-z]+ed\b/i.test(cleanLine) ||
      /^(?:designed|engineered|implemented|developed|built|created|spearheaded|trained|fine-tuned|studied|analyzed|evaluated)\b/i.test(cleanLine) ||
      isBulletPrefix
    ) {
      finalizeBullet();
      currentBullet = cleanLine;
    } else {
      currentBullet = currentBullet ? `${currentBullet} ${cleanLine}` : cleanLine;
    }

    if (currentBullet.endsWith('.') || currentBullet.endsWith(';')) {
      finalizeBullet();
    }
  }
  finalizeBullet();
  if (currentProj) projects.push(currentProj);

  // Set project descriptions from first bullet if description is empty
  projects.forEach((p) => {
    if (!p.description && p.bullets.length > 0) {
      p.description = p.bullets[0];
    }
  });

  // 8. Certifications Extraction
  const certLines = getSectionLines('certifications');
  const certifications = [];
  const isSoftSkillCandidate = (val) => {
    const s = String(val || '').toLowerCase().trim();
    return /^(?:problem\s+solving|critical\s+thinking|team\s+collaboration|teamwork|leadership|team\s+leadership|communication|interpersonal\s+skills|time\s+management|work\s+ethic|adaptability|flexibility|strategic\s+thinking|strategic\s+leadership|conflict\s+resolution|negotiation|public\s+speaking|presentation\s+skills|emotional\s+intelligence|creativity|cross-functional\s+communication|agile\s*&?\s*scrum(?:\s+delivery)?|agile\s+delivery)$/i.test(s);
  };

  certLines.forEach((line) => {
    const cleaned = line.replace(/^[•\-\*·▪\s]+/, '').trim();
    if (cleaned.length > 3 && !/^(certifications?|certificates?)$/i.test(cleaned)) {
      const dateMatch = cleaned.match(/\b(20\d{2})\b/);
      const parts = cleaned.split(/[-–—|,(]/).map((p) => p.trim()).filter(Boolean);
      const certName = parts[0] || cleaned;

      if (isSoftSkillCandidate(certName) && !parts[1] && !dateMatch) {
        if (!softSkills.includes(certName)) softSkills.push(certName);
        return;
      }

      certifications.push({
        name: certName,
        issuer: parts[1] || '',
        date: dateMatch ? dateMatch[1] : '',
      });
    }
  });

  // 9. Publications & Research Papers Extraction
  const pubLines = getSectionLines('publications');
  const publications = [];
  if (pubLines.length > 0) {
    let currentPub = null;
    pubLines.forEach((line) => {
      const cleaned = line.replace(/^[•\-\*·▪\s]+/, '').trim();
      if (!cleaned || /^(publications?|research\s+papers?|research|papers?)$/i.test(cleaned)) return;
      const dateMatch = cleaned.match(/\b(20\d{2})\b/);
      const doiMatch = cleaned.match(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/);
      const urlMatch = cleaned.match(/https?:\/\/[^\s]+/i);

      if (!currentPub) {
        currentPub = {
          title: cleaned,
          publisher: '',
          authors: '',
          date: dateMatch ? dateMatch[1] : '',
          link: doiMatch ? `https://doi.org/${doiMatch[1]}` : (urlMatch ? urlMatch[0] : ''),
          description: '',
        };
      } else if (!currentPub.publisher && cleaned.length < 50 && !cleaned.endsWith('.')) {
        currentPub.publisher = cleaned;
      } else {
        currentPub.description = currentPub.description ? `${currentPub.description} ${cleaned}` : cleaned;
      }
    });
    if (currentPub) publications.push(currentPub);
  }

  // 10. Languages Extraction
  const langLines = getSectionLines('languages');
  const languages = [];
  langLines.forEach((l) => {
    const cleanL = fixKerning(l.replace(/^[•\-\*·▪\s]+/, '').trim());
    if (cleanL && cleanL.length > 2 && cleanL.length < 150 && !/^(languages?|known\s+languages?)$/i.test(cleanL)) {
      cleanL.split(/[,/|•\t]+/).forEach((lang) => {
        const trimmed = lang.replace(/\s*\([^)]*\)/g, '').trim();
        if (trimmed && trimmed.length > 1 && !languages.includes(trimmed)) languages.push(trimmed);
      });
    }
  });

  return {
    personalInfo: {
      fullName: fullName || 'Candidate',
      targetRole: targetRole || '',
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location,
      linkedIn: linkedInMatch ? (linkedInMatch[0].startsWith('http') ? linkedInMatch[0] : `https://${linkedInMatch[0]}`) : '',
      portfolio: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : (portfolioMatch ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`) : ''),
    },
    summary,
    experience: experience.slice(0, 10),
    education: education.slice(0, 5),
    skills: {
      technical: finalTechSkills.length > 0 ? finalTechSkills : ['Software Engineering', 'Problem Solving'],
      soft: softSkills,
      languages: languages.length > 0 ? languages : ['English'],
    },
    projects: projects.slice(0, 8),
    certifications: certifications.slice(0, 10),
    publications: publications.slice(0, 8),
  };
};

export default extractTextFromPdf;
export { extractTextFromPdf, extractFallbackSections as parseResumeLocally };
