# V4000 OMEGA ULTIMATE - Backup Knowledge

## Source
Original file: `temp/prompt vbook.md`
Author: Predecessor (Unknown)
Version: V4000.0 FINAL

## Key Knowledge Points

### 1. ES5 Rhino Strict Contract
- ALLOWED: var, function, for, while, if/else, try/catch, Array methods, JSON, regex
- FORBIDDEN: let, const, =>, async/await, Promise, template literals, destructuring, class
- MANDATORY GATE: Regex pattern to check forbidden syntax

### 2. 4-Step Surgical Protocol
1. ISOLATION & FREEZE: Only patch failing modules
2. COLAB PRE-TESTING: Test Regex, Decryptor, KDF in Python
3. TARGETED PATCHING: Minimal code intervention
4. AUDIT: Zero-injection, preserve empty fields

### 3. Vietnamese UX Contract
- Status must be Vietnamese only
- Display order: Tác giả → Thể loại → Số chương → Tình trạng → Mô tả
- Keep empty fields
- Don't translate VI/ZH content

### 4. Performance Optimization
- Use while(i--) for arrays > 10
- Array.join for text aggregation
- Batch TOC 500 chapters
- Performance targets: Chapter < 150ms, TOC < 300ms, Search < 200ms

### 5. Chapter Hyperclean Pipeline
10-step process for cleaning chapter content
- Remove script/style/iframe
- Strip zero-width characters
- Remove first/last 25 lines
- Line-by-line ad filter
- Paragraph restore
- Force chapter title
- Validate length >= 100 chars

### 6. Core Principles
- ZERO-GUESSING: Always scan site DOM/API before building
- ZERO-INJECTION: Preserve original data
- VIETNAMESE UX FIRST
- SELF-HEAL: Auto switch selector/API if site changes

## Implementation Notes
This knowledge has been integrated into COMPLETE_DOCUMENTATION.md
Original temp file should be preserved for reference if needed
