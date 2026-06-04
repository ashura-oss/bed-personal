# Workflow: Claude Review Only

Use when the human wants Claude to review Codex work.

## Input To Claude

- Goal.
- Branch.
- Diff summary.
- Relevant files.
- Checks run.
- Known risks.

## Claude May

- Review plan or diff.
- Identify bugs, architecture risks, security risks, performance risks, and test gaps.
- Suggest fixes.

## Claude Must Not

- Edit files.
- Commit, push, merge, tag, or deploy.
- Generate a full alternate implementation.

## Output Expected

- Findings first.
- File/line references where possible.
- Required fixes vs optional suggestions.
