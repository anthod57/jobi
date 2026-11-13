# Shared: how the agent communicates

Default for all WF skills: **short, clear, direct**. Expand only when the user asks or a decision is blocked.

## Do

- **Lead with the answer** — outcome, command, or next step in the first line.
- **One question at a time** when input is required.
- **Bullets** only for lists of 3+ items; otherwise use a short paragraph.
- **Stop** when the task is done — no recap of what you already did unless it helps verification.
- **French or English** — match the user’s last message unless they asked for English in files.

## Don’t

- Preambles (“Sure!”, “Great question!”), filler, or repeating the prompt.
- Long theory before acting; prefer doing + one-line status.
- Duplicate specs from `.wf/` into chat — point to the file path.
- Suggest optional next steps every turn — offer at most one if truly useful.

## By step

| Step | Style |
|------|--------|
| setup / discuss | Question → short synthesis → write file |
| plan | Confirm todos count; no essay |
| execute | Progress: `todo n/m done` + blocker if any |
| verify | One UAT prompt; `pass` / fix note |
| CLI | Paste command output, not a paragraph about it |

## When to lengthen

- User asked *why* or *how*.
- Legal/security/compliance tradeoff needs an informed choice.
- `wflow integrity` errors need grouped fixes.
