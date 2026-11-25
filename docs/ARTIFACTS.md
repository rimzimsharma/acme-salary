# Artifacts index

The assessment brief asks for artifacts that explain thinking and approach. Each type it lists, and where to find it:

| Artifact the brief lists | Where it is |
|---|---|
| Requirements document | [REQUIREMENTS.md](REQUIREMENTS.md) (also as [Word](Salary_Management_Requirements.docx)); written before any code was built |
| Planning or design notes | [DESIGN.md](DESIGN.md) |
| Architecture diagrams | [ARCHITECTURE.md](ARCHITECTURE.md): system overview, list flow, currency comparison, data model |
| Prompts or instructions used with AI tools | [AI_USAGE.md](AI_USAGE.md) (instructions given, mistakes made and caught); the agents in [`.claude/agents/`](../.claude/agents): `quality-reviewer` (audits the repo against the brief) and `rubocop-checker` (Ruby style); and the `/rubocop` command in [`.claude/skills/rubocop/`](../.claude/skills/rubocop/SKILL.md) |
| Trade-off explanations | [DESIGN.md](DESIGN.md): data model, multiple currencies, insights, frontend choices, known limitations |
| Performance considerations | [DESIGN.md](DESIGN.md#performance): measured timings against 10,000 employees and how the queries are indexed |

Also in the repository: the commit history (one behaviour per commit), test coverage commands in the
[README](../README.md), and the tests themselves (backend `backend/test/`, frontend next to the code).
