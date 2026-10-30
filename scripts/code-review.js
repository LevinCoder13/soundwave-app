/**
 * CodeRabbit-Style Automated Code Quality & Security Gate
 * Scans JavaScript and SQL files in the workspace for common agentic anti-patterns:
 * - SQL Injection risks
 * - Missing try/catch or unhandled async rejections
 * - Stream event listener omissions (causing unhandled stream crashes)
 * - Leaked credentials or tokens
 */

const fs = require('fs');
const path = require('path');

const BACKEND_SRC = path.resolve(__dirname, '../backend/src');

const CHECKS = [
  {
    id: 'SEC-001',
    severity: 'CRITICAL',
    title: 'Potential SQL Injection (String Interpolation in Query)',
    regex: /(?:query|execute)\s*\(\s*`[^`]*\$\{.*?\}[^`]*`\s*\)/i,
    recommendation: 'Use parameterized queries (?) instead of template literal string interpolation.',
  },
  {
    id: 'SEC-002',
    severity: 'HIGH',
    title: 'Hardcoded Sensitive Secret / API Key',
    regex: /(?:secret|password|jwt_secret|token)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i,
    recommendation: 'Store sensitive keys in process.env (.env file) and load via dotenv.',
  },
  {
    id: 'STREAM-001',
    severity: 'HIGH',
    title: 'Audio Stream Pipe Without Error Listener',
    customCheck: (content) => {
      if (content.includes('.pipe(') && !content.includes(".on('error'") && !content.includes('.on("error"')) {
        return 'Found .pipe() on a stream without an explicit .on("error") handler. An aborted stream may crash Express.';
      }
      return null;
    },
    recommendation: 'Always attach `stream.on("error", (err) => next(err))` before piping response.',
  },
  {
    id: 'ERR-001',
    severity: 'MEDIUM',
    title: 'Async Express Handler Without Error Handling (next(err) or try/catch)',
    customCheck: (content) => {
      // Basic heuristic for async handlers missing catch
      const asyncRouteRegex = /router\.(?:get|post|put|delete)\([^,]+,\s*async\s*\((?:req,\s*res|req,\s*res,\s*next)\)\s*=>\s*\{/g;
      let match;
      let count = 0;
      while ((match = asyncRouteRegex.exec(content)) !== null) {
        count++;
      }
      if (count > 0 && !content.includes('catch') && !content.includes('try')) {
        return `Found ${count} async route handler(s) with no try/catch block.`;
      }
      return null;
    },
    recommendation: 'Wrap async route bodies in try/catch or use an express-async-handler utility.',
  },
];

function getAllJsFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules') {
        results = results.concat(getAllJsFiles(fullPath));
      }
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

console.log('====================================================');
console.log(' 🐇 CodeRabbit Quality Gate: Static Analysis & Security Check');
console.log('====================================================');

const files = getAllJsFiles(BACKEND_SRC);
const findings = [];

files.forEach((filePath) => {
  const relative = path.relative(path.resolve(__dirname, '..'), filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  CHECKS.forEach((check) => {
    if (check.regex) {
      lines.forEach((line, index) => {
        if (check.regex.test(line)) {
          findings.push({
            file: relative,
            line: index + 1,
            checkId: check.id,
            severity: check.severity,
            title: check.title,
            snippet: line.trim(),
            recommendation: check.recommendation,
          });
        }
      });
    }

    if (check.customCheck) {
      const issue = check.customCheck(content);
      if (issue) {
        findings.push({
          file: relative,
          line: 1,
          checkId: check.id,
          severity: check.severity,
          title: check.title,
          snippet: issue,
          recommendation: check.recommendation,
        });
      }
    }
  });
});

if (findings.length === 0) {
  console.log('\n✅ All checks passed! No critical security or architecture issues detected.');
  console.log(`Scanned ${files.length} backend source files.`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Found ${findings.length} potential issue(s):\n`);

  findings.forEach((f, idx) => {
    const colorMark = f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '🟠' : '🟡';
    console.log(`${idx + 1}. ${colorMark} [${f.severity}] ${f.title} (${f.checkId})`);
    console.log(`   File: ${f.file}:${f.line}`);
    console.log(`   Detail: ${f.snippet}`);
    console.log(`   Fix: ${f.recommendation}\n`);
  });

  const criticals = findings.filter((f) => f.severity === 'CRITICAL');
  if (criticals.length > 0) {
    console.error(`🚨 Review Failed: ${criticals.length} CRITICAL violation(s) must be resolved before merging.`);
    process.exit(1);
  } else {
    console.log('ℹ️  No critical blockers found. Warnings reported above.');
    process.exit(0);
  }
}
