# Contributing to AWS Database Agent Skills

## Adding a New Rule

Each rule is a Markdown file in the `references/` directory of a skill. Rules follow a consistent format:

### File naming

Use the section prefix followed by a descriptive name:
```
{section-prefix}-{descriptive-name}.md
```

Examples: `conn-pooling.md`, `perf-big-keys.md`, `model-partition-key-design.md`

### File format

```markdown
---
title: Short Descriptive Title
impact: CRITICAL | HIGH | MEDIUM | LOW
impactDescription: Brief quantified impact (e.g., "10-100x latency reduction")
tags: comma, separated, tags
---

## Short Descriptive Title

One paragraph explaining why this matters.

**Incorrect (description of what's wrong):**

\```python
# Python example showing the anti-pattern
\```

\```javascript
// Node.js example showing the anti-pattern
\```

**Correct (description of the fix):**

\```python
# Python example showing the correct approach
\```

\```javascript
// Node.js example showing the correct approach
\```

Reference: [Link to AWS docs](https://docs.aws.amazon.com/...)
```

### Guidelines

- Keep each rule file focused on one specific issue
- Always include both incorrect and correct examples
- Include Python (boto3) and Node.js (AWS SDK v3) examples where applicable
- For Valkey/Redis commands, show the raw commands alongside SDK usage
- Quantify impact where possible (latency, throughput, cost)
- Link to official AWS documentation

## Adding a New Service Skill

1. Create `skills/{service-name}/SKILL.md` with valid frontmatter
2. Create `skills/{service-name}/references/_sections.md` defining categories
3. Add reference files following the naming convention above
4. Update `README.md` with the new skill description
5. Run `npm test` to validate

## Validation

Skill names must:
- Be 1-64 characters
- Contain only lowercase letters, numbers, and hyphens
- Not start or end with a hyphen
- Match the parent directory name

Descriptions must be 1-1024 characters.
