import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const srcDir = join(fileURLToPath(new URL('..', import.meta.url)), 'src');
const extensions = new Set(['.js']);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else if (extensions.has(extname(full))) {
      yield full;
    }
  }
}

// Keywords/operators after which `/` starts a regex
const REGEX_START_RE = /(?:return|case|typeof|instanceof|void|delete|throw|new|in|of|do|yield|import)\s*$/;

// State machine for stripping JS comments without breaking strings/regex/templates
const State = {
  NORMAL: 0,
  LINE_COMMENT: 1,
  BLOCK_COMMENT: 2,
  SINGLE_STRING: 3,
  DOUBLE_STRING: 4,
  TEMPLATE: 5,       // inside backtick text
  TEMPLATE_EXPR: 6,  // inside ${...} inside template
  REGEX: 7,
};

function isRegexStart(code, pos) {
  if (pos === 0) return true;
  let i = pos - 1;
  while (i >= 0 && /\s/.test(code[i])) i--;
  if (i < 0) return true;
  const ch = code[i];
  // After these tokens, / is always division
  if (/[\d\w$)]/.test(ch) && ch !== '_') return false;
  if (ch === '}' || ch === ']') return false;
  // After most operators/punctuation, / starts a regex
  // Check for keywords before the position
  const before = code.slice(Math.max(0, i - 10), i + 1);
  if (REGEX_START_RE.test(before)) return true;
  return true; // default to regex for safety
}

function stripJSComments(code) {
  const out = [];
  let state = State.NORMAL;
  let i = 0;
  // Stack for template expression brace depths
  let exprDepth = 0;
  // Regex-specific state
  let regexInClass = false;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    switch (state) {
      case State.NORMAL: {
        if (ch === '/' && next === '/') {
          state = State.LINE_COMMENT;
          i++;
          continue;
        }
        if (ch === '/' && next === '*') {
          const isJSDoc = code[i + 2] === '*';
          if (isJSDoc) {
            // Preserve JSDoc comments
            let end = code.indexOf('*/', i + 2);
            end = end === -1 ? code.length : end + 2;
            out.push(code.slice(i, end));
            i = end;
            continue;
          }
          state = State.BLOCK_COMMENT;
          i++;
          continue;
        }
        if (ch === "'") {
          state = State.SINGLE_STRING;
          out.push(ch);
          i++;
          continue;
        }
        if (ch === '"') {
          state = State.DOUBLE_STRING;
          out.push(ch);
          i++;
          continue;
        }
        if (ch === '`') {
          state = State.TEMPLATE;
          exprDepth = 0;
          out.push(ch);
          i++;
          continue;
        }
        if (ch === '/') {
          if (isRegexStart(code, i)) {
            state = State.REGEX;
            regexInClass = false;
            out.push(ch);
            i++;
            continue;
          }
        }
        out.push(ch);
        i++;
        break;
      }

      case State.LINE_COMMENT: {
        if (ch === '\n') {
          state = State.NORMAL;
          out.push('\n');
        }
        // Also skip CR
        i++;
        break;
      }

      case State.BLOCK_COMMENT: {
        if (ch === '*' && next === '/') {
          state = State.NORMAL;
          i += 2;
        } else {
          if (ch === '\n') out.push('\n');
          i++;
        }
        break;
      }

      case State.SINGLE_STRING: {
        out.push(ch);
        if (ch === '\\' && next) {
          out.push(next);
          i += 2;
        } else if (ch === "'") {
          state = State.NORMAL;
          i++;
        } else if (ch === '\n') {
          state = State.NORMAL;
          i++;
        } else {
          i++;
        }
        break;
      }

      case State.DOUBLE_STRING: {
        out.push(ch);
        if (ch === '\\' && next) {
          out.push(next);
          i += 2;
        } else if (ch === '"') {
          state = State.NORMAL;
          i++;
        } else if (ch === '\n') {
          state = State.NORMAL;
          i++;
        } else {
          i++;
        }
        break;
      }

      case State.TEMPLATE: {
        out.push(ch);
        if (ch === '\\' && next) {
          out.push(next);
          i += 2;
        } else if (ch === '`') {
          state = State.NORMAL;
          i++;
        } else if (ch === '$' && next === '{') {
          out.push(next);
          exprDepth = 1;
          state = State.TEMPLATE_EXPR;
          i += 2;
        } else {
          i++;
        }
        break;
      }

      case State.TEMPLATE_EXPR: {
        // Inside ${...} of a template - this is JS code
        if (ch === "'") {
          out.push(ch);
          i++;
          // Need to handle string inside template expr
          let s = i;
          while (i < code.length) {
            if (code[i] === '\\') { out.push(code[i] + (code[i+1] || '')); i += 2; continue; }
            out.push(code[i]);
            if (code[i] === "'") { i++; break; }
            if (code[i] === '\n') { i++; break; }
            i++;
          }
          continue;
        }
        if (ch === '"') {
          out.push(ch);
          i++;
          while (i < code.length) {
            if (code[i] === '\\') { out.push(code[i] + (code[i+1] || '')); i += 2; continue; }
            out.push(code[i]);
            if (code[i] === '"') { i++; break; }
            if (code[i] === '\n') { i++; break; }
            i++;
          }
          continue;
        }
        if (ch === '`') {
          // Nested template literal
          out.push(ch);
          let nestedDepth = 0;
          i++;
          while (i < code.length) {
            if (code[i] === '\\') { out.push(code[i] + (code[i+1] || '')); i += 2; continue; }
            out.push(code[i]);
            if (code[i] === '`' && nestedDepth === 0) { i++; break; }
            if (code[i] === '$' && code[i+1] === '{') { out.push(code[i+1]); nestedDepth++; i += 2; continue; }
            if (code[i] === '{') nestedDepth++;
            if (code[i] === '}') nestedDepth--;
            i++;
          }
          continue;
        }
        // Handle comments inside template expressions
        if (ch === '/' && next === '/') {
          const end = code.indexOf('\n', i);
          const sliceEnd = end === -1 ? code.length : end;
          i = sliceEnd;
          continue;
        }
        if (ch === '/' && next === '*') {
          const isJSDoc = code[i + 2] === '*';
          let end = code.indexOf('*/', i + 2);
          end = end === -1 ? code.length : end + 2;
          if (isJSDoc) out += code.slice(i, end);
          i = end;
          continue;
        }
        // Handle regex inside template expressions
        if (ch === '/' && isRegexStart(code.slice(0, i) + out.join(''), i)) {
          out.push(ch);
          i++;
          regexInClass = false;
          while (i < code.length) {
            if (code[i] === '\\') { out.push(code[i] + (code[i+1] || '')); i += 2; continue; }
            if (code[i] === '[') regexInClass = true;
            if (code[i] === ']') regexInClass = false;
            out.push(code[i]);
            if (code[i] === '/' && !regexInClass) { i++; break; }
            i++;
          }
          // flags
          while (i < code.length && /[dgimsuvy]/.test(code[i])) { out.push(code[i]); i++; }
          continue;
        }
        // Track brace depth for template expression
        if (ch === '{') { exprDepth++; }
        if (ch === '}') {
          exprDepth--;
          out.push(ch);
          i++;
          if (exprDepth === 0) {
            state = State.TEMPLATE;
          }
          continue;
        }
        out.push(ch);
        i++;
        break;
      }

      case State.REGEX: {
        out.push(ch);
        if (ch === '\\' && next) {
          out.push(next);
          i += 2;
        } else if (ch === '[') {
          regexInClass = true;
          i++;
        } else if (ch === ']') {
          regexInClass = false;
          i++;
        } else if (ch === '/' && !regexInClass) {
          state = State.NORMAL;
          i++;
          // Consume flags
          while (i < code.length && /[dgimsuvy]/.test(code[i])) {
            out.push(code[i]);
            i++;
          }
        } else {
          i++;
        }
        break;
      }
    }
  }

  return out.join('');
}

let total = 0;

for (const file of walk(srcDir)) {
  const code = readFileSync(file, 'utf8');
  const stripped = stripJSComments(code);
  const removed = code.length - stripped.length;
  if (removed > 0) {
    writeFileSync(file, stripped, 'utf8');
    total += removed;
  }
}

console.log(`Stripped ${total} bytes of comments from src/`);
