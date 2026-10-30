/**
 * Ralph State & Task Manager
 * Implements the file-backed state engine for the Ralph Loop pattern.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PRD_PATH = path.resolve(__dirname, '../.gsd/PRD.json');
const STATE_PATH = path.resolve(__dirname, '../.gsd/STATE.md');

function loadPRD() {
  if (!fs.existsSync(PRD_PATH)) {
    console.error(`[Ralph] Error: PRD file not found at ${PRD_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(PRD_PATH, 'utf-8'));
}

function savePRD(prd) {
  fs.writeFileSync(PRD_PATH, JSON.stringify(prd, null, 2), 'utf-8');
}

function updateStateFile(prd, activeTask) {
  const completed = prd.tasks.filter((t) => t.status === 'completed').length;
  const total = prd.tasks.length;
  const activeTaskContent = activeTask
    ? `- **ID:** \`${activeTask.id}\`\n- **Title:** ${activeTask.title}\n- **Category:** ${activeTask.category}\n- **Status:** In Progress`
    : `- **Status:** All tasks completed! 🎉`;

  const content = `# Active Project State (Anti-Context-Rot Ledger)

## Active Task
${activeTaskContent}

## Last Verified Checkpoint
- **Timestamp:** ${new Date().toISOString()}
- **Progress:** ${completed} / ${total} tasks completed (${Math.round((completed / total) * 100)}%)

## Progress Summary
- Completed: ${completed}
- Pending: ${total - completed}
- Active Milestone: ${prd.activeMilestone}

## Next Recommended Actions
${
  activeTask
    ? `Implement acceptance criteria for **${activeTask.title}** and run backpressure check.`
    : `Open pull request and trigger CodeRabbit review gate.`
}
`;
  fs.writeFileSync(STATE_PATH, content, 'utf-8');
}

function getNextTask(prd) {
  return prd.tasks.find((t) => t.status === 'pending' || t.status === 'in_progress');
}

const command = process.argv[2] || 'status';

switch (command) {
  case 'status': {
    const prd = loadPRD();
    const completed = prd.tasks.filter((t) => t.status === 'completed').length;
    const total = prd.tasks.length;
    const next = getNextTask(prd);

    console.log('==================================================');
    console.log(`🤖 Ralph Loop: ${prd.project}`);
    console.log(`Milestone: ${prd.activeMilestone}`);
    console.log(`Progress:  [${completed}/${total}] (${Math.round((completed / total) * 100)}%)`);
    console.log('==================================================');

    prd.tasks.forEach((t) => {
      const mark = t.status === 'completed' ? '✓' : t.status === 'in_progress' ? '►' : ' ';
      console.log(` [${mark}] ${t.id}: ${t.title} (${t.status})`);
    });

    if (next) {
      console.log('\n👉 Next Task to Execute:');
      console.log(`   ID:       ${next.id}`);
      console.log(`   Title:    ${next.title}`);
      console.log(`   Criteria: \n     - ${next.acceptanceCriteria.join('\n     - ')}`);
    } else {
      console.log('\n🎉 All tasks in PRD are completed!');
    }
    break;
  }

  case 'next-prompt': {
    const prd = loadPRD();
    const next = getNextTask(prd);
    if (!next) {
      console.log('ALL_TASKS_COMPLETED');
      process.exit(0);
    }
    console.log(`### TASK: ${next.id} - ${next.title}`);
    console.log(`Category: ${next.category}`);
    console.log('\n**Acceptance Criteria:**');
    next.acceptanceCriteria.forEach((c) => console.log(`- ${c}`));
    console.log('\n**Target Files:**');
    next.files.forEach((f) => console.log(`- ${f}`));
    console.log(`\n**Verification Backpressure:**\n\`${next.verificationCommand}\``);
    break;
  }

  case 'verify': {
    const prd = loadPRD();
    const taskId = process.argv[3];
    const task = taskId ? prd.tasks.find((t) => t.id === taskId) : getNextTask(prd);

    if (!task) {
      console.error('[Ralph] No task found to verify.');
      process.exit(1);
    }

    console.log(`[Ralph] Running verification for ${task.id}: "${task.title}"...`);
    console.log(`[Ralph] Command: ${task.verificationCommand}`);

    try {
      execSync(task.verificationCommand, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
      console.log(`[Ralph] ✓ Verification PASSED for ${task.id}`);
      process.exit(0);
    } catch (err) {
      console.error(`[Ralph] ✗ Verification FAILED for ${task.id}`);
      process.exit(1);
    }
  }

  case 'complete': {
    const prd = loadPRD();
    const taskId = process.argv[3];
    const task = taskId ? prd.tasks.find((t) => t.id === taskId) : getNextTask(prd);

    if (!task) {
      console.error('[Ralph] No task found to complete.');
      process.exit(1);
    }

    task.status = 'completed';
    savePRD(prd);
    const next = getNextTask(prd);
    updateStateFile(prd, next);

    console.log(`[Ralph] Task ${task.id} marked as COMPLETED.`);

    // Optional: automatic git commit if in git repo
    try {
      execSync(`git add . && git commit -m "feat(${task.category}): complete ${task.id} - ${task.title}"`, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      });
      console.log(`[Ralph] Git commit created for ${task.id}`);
    } catch (e) {
      console.log('[Ralph] Note: Git commit skipped or working tree clean.');
    }
    break;
  }

  default:
    console.log(`Unknown command: ${command}`);
    console.log('Available commands: status, next-prompt, verify, complete');
    process.exit(1);
}
