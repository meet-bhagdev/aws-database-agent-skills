# AGENTS.md

This repository contains Agent Skills for AWS database services. Each skill is in `skills/{name}/` and follows the [Agent Skills](https://agentskills.io/) open standard.

## Repository Structure

- `skills/aws-elasticache/` — ElastiCache (Valkey) best practices
- `skills/aws-dynamodb/` — DynamoDB best practices
- `skills/aws-aurora/` — Aurora (MySQL/PostgreSQL) best practices
- `skills/aws-databases/` — Umbrella skill for database selection and cross-cutting concerns

## Conventions

- Reference files use `{section-prefix}-{name}.md` naming
- Each reference file has YAML frontmatter with `title`, `impact`, `impactDescription`, and `tags`
- Code examples are in Python (boto3) and Node.js (AWS SDK v3)
- Every reference shows an incorrect pattern followed by the correct pattern
- `_sections.md` in each skill's `references/` directory defines the rule categories
