$ErrorActionPreference = 'Stop'

# Run from the repository root. This script preserves existing work and creates backups.
$repoRoot = (Get-Location).Path
$parserPath = Join-Path $repoRoot 'server/src/utils/resumeParser.js'
$importPath = Join-Path $repoRoot 'server/src/utils/resumeImport.js'

foreach ($path in @($parserPath, $importPath)) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Could not find '$path'. Open PowerShell at the project root. No files were changed."
  }
}

$parser = [System.IO.File]::ReadAllText($parserPath, [System.Text.Encoding]::UTF8)
$importCode = [System.IO.File]::ReadAllText($importPath, [System.Text.Encoding]::UTF8)

# Prepare all replacements in memory first. Do not write if a target block is missing.
$softSkillHeader = "    { type: 'softSkills', regex: /^(?:soft\s+skills|interpersonal\s+skills|people\s+skills|professional\s+skills)\b/i },"
if ($parser -notmatch "type: 'softSkills'") {
  $languagesPattern = "(?m)^\s*\{ type: 'languages', regex: /[^\r\n]*\},\s*$"
  if (-not [regex]::IsMatch($parser, $languagesPattern)) {
    throw 'Could not locate the languages section header in resumeParser.js. No files were changed.'
  }
  $parser = [regex]::Replace($parser, $languagesPattern, {
    param($match)
    $match.Value + "`r`n" + $softSkillHeader
  }, 1)
}

# Project parsing: attach bullets, technology stacks, and continuation lines to the
# active project instead of treating every short line as a new project.
$projectPattern = '(?s)  // 7\. Projects Extraction.*?  // 8\. Certifications Extraction'
if (-not [regex]::IsMatch($parser, $projectPattern)) {
  throw 'Could not locate the Projects Extraction block in resumeParser.js. No files were changed.'
}

$projectBlock = @'
  // 7. Projects Extraction
  const projLines = getSectionLines('projects');
  const projects = [];
  let currentProj = null;
  const projectBulletPattern = /^[\u2022\u25aa\u25cf\u25e6\u2023\u25b8\u00b7*\-]\s*/u;
  const knownTechnologyPattern = /\b(?:api|rest|graphql|react(?:\s+flow)?|tailwind(?:\s+css)?|node(?:\.js)?|express|mongodb|mongoose|postgres(?:ql)?|mysql|python|java|javascript|typescript|html|css|vite|langchain|chromadb|gemini|openai|aws|docker|kubernetes|git|firebase|supabase|flask|fastapi|streamlit|pandas|numpy|scikit.learn|tensorflow|pytorch|sql|jwt|redis|vercel|render|redux|three\.js|bootstrap|material.ui)\b/i;

  const cleanProjectText = (value) => String(value || '').replace(projectBulletPattern, '').trim();
  const extractTechnologyList = (value) => String(value || '')
    .replace(/^(?:technologies|tech(?:nology)?\s*stack|tools|built\s+with|stack)\s*:\s*/i, '')
    .split(/\s*[,|;·]\s*/)
    .map((item) => item.trim().replace(/^[\u2022\u25aa\u25cf\u25e6\u2023\u25b8\u00b7*\-\s]+/u, ''))
    .filter((item) => item.length > 1);

  const isTechnologyLine = (line) => {
    if (/^(?:technologies|tech(?:nology)?\s*stack|tools|built\s+with|stack)\s*:/i.test(line)) return true;
    const parts = line.split(/\s*[,|;]\s*/).filter(Boolean);
    return parts.length >= 2 && parts.length <= 12 && !/[.!?]$/.test(line)
      && parts.filter((part) => knownTechnologyPattern.test(part)).length >= 2;
  };

  const isDescriptionLine = (line) => line.length > 78
    || (line.length >= 42 && line.split(/\s+/).length >= 7)
    || /[.!?]$/.test(line)
    || /^(?:a|an|the|this|these|it|built|developed|created|implemented|designed|engineered|integrated|automated|improved|led|used|leveraged|utilized|provides?|enables?|supports?|helps?|allows?|responsible|using|with|for|to)\b/i.test(line)
    || /\b(?:which|that|using|leveraging|enabling|to improve|to automate|to streamline|for users|was built|was developed)\b/i.test(line);

  const startProject = (line) => {
    let cleaned = cleanProjectText(line).replace(/^\d{1,2}[.)]\s*/, '').trim();
    const explicitProject = cleaned.match(/^(?:project(?:\s+name)?)\s*:\s*(.+)$/i);
    if (explicitProject) cleaned = explicitProject[1].trim();
    const parts = cleaned.split(/\s+[–—|:]\s+/).map((part) => part.trim()).filter(Boolean);
    return {
      name: parts[0] || 'Project',
      description: parts.slice(1).join(' — '),
      technologies: [],
      bullets: [],
    };
  };

  const appendProjectDescription = (project, line) => {
    if (!project.description) project.description = line;
    else if (!project.description.toLowerCase().includes(line.toLowerCase())) {
      project.description = `${project.description} ${line}`;
    }
  };

  const saveCurrentProject = () => {
    if (!currentProj || !currentProj.name) return;
    currentProj.technologies = [...new Set(currentProj.technologies)];
    currentProj.bullets = [...new Set(currentProj.bullets)];
    projects.push(currentProj);
  };

  projLines.forEach((rawLine) => {
    const line = String(rawLine || '').trim();
    if (!line) return;
    const isBullet = projectBulletPattern.test(line);
    const cleaned = cleanProjectText(line);
    if (!cleaned || /^(?:projects?|key\s+projects?)$/i.test(cleaned)) return;

    if (isTechnologyLine(cleaned)) {
      if (!currentProj) currentProj = startProject('Project');
      currentProj.technologies.push(...extractTechnologyList(cleaned));
      return;
    }

    if (isBullet) {
      if (!currentProj) currentProj = startProject('Project');
      currentProj.bullets.push(cleaned);
      return;
    }

    const looksLikeTitle = cleaned.length <= 65
      && !isDescriptionLine(cleaned)
      && !/^(?:description|technologies|tech(?:nology)?\s*stack|tools|built\s+with|stack)\s*:/i.test(cleaned);

    if (!currentProj) {
      currentProj = startProject(cleaned);
    } else if (looksLikeTitle) {
      saveCurrentProject();
      currentProj = startProject(cleaned);
    } else {
      appendProjectDescription(currentProj, cleaned);
    }
  });

  saveCurrentProject();
  // 8. Certifications Extraction
'@

$parser = [regex]::Replace($parser, $projectPattern, {
  param($match)
  $projectBlock
}, 1)

# Normalize identity across `name`/`title` and other schema aliases, so the same
# imported item is more likely to match between AI and deterministic extraction.
$identityPattern = '(?s)const itemIdentity = \(item\) => \{.*?\r?\n\};'
if (-not [regex]::IsMatch($importCode, $identityPattern)) {
  throw 'Could not locate itemIdentity in resumeImport.js. No files were changed.'
}

$identityBlock = @'
const itemIdentity = (item) => {
  if (typeof item === 'string') return item.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!item || typeof item !== 'object') return '';
  const canonical = item.name || item.title || item.company || item.role || item.institution;
  if (canonical) return String(canonical).trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return '';
};
'@

$importCode = [regex]::Replace($importCode, $identityPattern, {
  param($match)
  $identityBlock.TrimEnd()
}, 1)

# Verify expected replacement markers before touching disk.
if ($parser -notmatch 'const isTechnologyLine' -or $parser -notmatch 'saveCurrentProject\(\);' -or $parser -notmatch "type: 'softSkills'") {
  throw 'Post-edit validation failed for resumeParser.js. No files were changed.'
}
if ($importCode -notmatch 'const canonical = item\.name \|\| item\.title') {
  throw 'Post-edit validation failed for resumeImport.js. No files were changed.'
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$parserBackup = "$parserPath.bak-$stamp"
$importBackup = "$importPath.bak-$stamp"
Copy-Item -LiteralPath $parserPath -Destination $parserBackup
Copy-Item -LiteralPath $importPath -Destination $importBackup

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($parserPath, $parser, $utf8NoBom)
[System.IO.File]::WriteAllText($importPath, $importCode, $utf8NoBom)

Write-Host "`nUpdated files:" -ForegroundColor Green
Write-Host "  server/src/utils/resumeParser.js"
Write-Host "  server/src/utils/resumeImport.js"
Write-Host "`nBackups created:" -ForegroundColor Green
Write-Host "  $parserBackup"
Write-Host "  $importBackup"

Write-Host "`nRunning server tests..." -ForegroundColor Cyan
npm test --prefix server
if ($LASTEXITCODE -ne 0) {
  throw "Server tests failed (exit code $LASTEXITCODE). Backups are available above; do not commit or push."
}

Write-Host "`nRunning client tests..." -ForegroundColor Cyan
npm test --prefix client
if ($LASTEXITCODE -ne 0) {
  throw "Client tests failed (exit code $LASTEXITCODE). Backups are available above; do not commit or push."
}

Write-Host "`nRunning client build..." -ForegroundColor Cyan
npm run build --prefix client
if ($LASTEXITCODE -ne 0) {
  throw "Client build failed (exit code $LASTEXITCODE). Backups are available above; do not commit or push."
}

Write-Host "`nChecks completed. Review the results and test a real resume upload before committing." -ForegroundColor Green
