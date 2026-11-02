#!/usr/bin/env node
// =============================================================================
// restore-template-baseline.js — Non-Destructive Template Restoration Utility
// =============================================================================
// Safely restores an approved template file from the Git baseline checkpoint
// without destructive git operations (no reset --hard, no clean -fd).
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const APPROVED_BASELINE_COMMIT = 'HEAD'; // Or specific tagged baseline commit

const TEMPLATE_FILES = {
  'modern-professional': 'client/src/components/templates/ModernProfessionalTemplate.jsx',
  'minimal-ats': 'client/src/components/templates/MinimalAtsTemplate.jsx',
  'executive-corporate': 'client/src/components/templates/ExecutiveCorporateTemplate.jsx',
  'software-engineer': 'client/src/components/templates/SoftwareEngineerTemplate.jsx',
  'aiml-engineer': 'client/src/components/templates/AimlEngineerTemplate.jsx',
  'creative-clean': 'client/src/components/templates/CreativeCleanTemplate.jsx',
  'registry': 'client/src/config/templateRegistry.js',
  'typography': 'client/src/config/resumeTypography.js',
};

function main() {
  const args = process.argv.slice(2);
  const target = args[0];
  const isExecute = args.includes('--apply');

  console.log('================================================================');
  console.log('RESUME TEMPLATE BASELINE RESTORATION & INTEGRITY TOOL');
  console.log('================================================================\n');

  if (!target || target === '--help' || target === '-h') {
    console.log('Usage: node scripts/restore-template-baseline.js <template-id|all> [--apply]');
    console.log('\nSupported targets:');
    Object.keys(TEMPLATE_FILES).forEach((id) => console.log(`  - ${id} (${TEMPLATE_FILES[id]})`));
    console.log('  - all (all 6 templates + registry)');
    console.log('\nWithout --apply, runs in safe verification / dry-run mode.');
    return;
  }

  const targetsToRestore = target === 'all' ? Object.keys(TEMPLATE_FILES) : [target];

  for (const tid of targetsToRestore) {
    const relPath = TEMPLATE_FILES[tid];
    if (!relPath) {
      console.error(`[Error] Unknown template identifier: "${tid}". Valid: ${Object.keys(TEMPLATE_FILES).join(', ')}`);
      process.exit(1);
    }

    const fullPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`[Warning] Target file missing: ${relPath}`);
    }

    // Check git diff
    try {
      const diff = execSync(`git diff ${APPROVED_BASELINE_COMMIT} -- "${relPath}"`, { encoding: 'utf-8' });
      if (!diff.trim()) {
        console.log(`[Clean] ${tid}: matches approved baseline perfectly.`);
      } else {
        console.log(`[Modified] ${tid} has unauthorized changes relative to baseline:`);
        console.log(diff.slice(0, 500) + (diff.length > 500 ? '\n... (truncated)' : ''));

        if (isExecute) {
          console.log(`--> Safely checkout approved file: ${relPath}`);
          execSync(`git checkout ${APPROVED_BASELINE_COMMIT} -- "${relPath}"`, { stdio: 'inherit' });
          console.log(`✓ Restored ${tid} from baseline.`);
        } else {
          console.log(`[Dry-Run] Run with '--apply' to restore this file safely.`);
        }
      }
    } catch (err) {
      console.error(`[Error checking ${tid}]:`, err.message);
    }
  }

  console.log('\nIntegrity check complete.');
}

main();
