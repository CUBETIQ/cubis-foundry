What Are Agent Skills?
Skills are an open standard supported by most major AI coding tools: Claude Code, Goose, Cursor, Amp, GitHub Copilot, Gemini CLI, VS Code, and many more.

At their simplest, a skill is a folder with a SKILL.md file with a set of instructions that an agent can discover and load on demand. Think of it like a playbook. When an agent encounters a task that matches a skill’s description, it loads those instructions and follows them. Skills can also include supporting files like scripts, templates, MCP servers, and configuration files.

The beauty is in the portability. Write a skill once, and it works for anyone across any agent that supports the format.

Codifying Tribal Knowledge: How We Use Skills
At Block, we built an internal Skills marketplace with over 100 skills and counting, plus curated bundles that package related skills together for specific roles and teams (e.g. frontend, android, iOS, etc).

These skills are deeply specific to how we work:

A skill that knows how to investigate restaurant POS crash patterns specific to our hardware and software
A skill that walks through our exact process for setting up feature flag experiments
A skill that knows our oncall runbook and which dashboards to check, which logs to pull, how to escalate
A skill that enforces our internal API style guide when engineers are designing new services
This is tribal knowledge. The kind of stuff that used to live in one person’s head, or in a doc that only three people knew existed. Now it’s in a shared, version controlled repository where any Block engineer can install it and any agent can use it.

The key shift is documentation goes from something you read to something your agent can execute. A runbook becomes a workflow. A style guide becomes an enforcer. An onboarding guide becomes an interactive tutor.

And because skills are just files in a repo, they get the same treatment as code: pull requests, reviews, version history. When a process changes, you update the skill and everyone’s agent gets the update.

Architecting a Good Skill
Skills are markdown files and executables. Creating them is fairly easy for engineers. Building skills that are actually good is where it gets interesting.

I’ll walk through the principles using a skill I designed called Repo Readiness. It evaluates a repository’s readiness for AI-assisted development by scoring it across several checks: Does the repo have agent context files? Are there AI workflows configured? Does the CI/CD pipeline incorporate AI tooling? Each check is pass/fail with a fixed point value, and the results roll up into an overall readiness score with a tier rating.

But these principles aren’t specific to scoring skills. We’ve seen them hold up across our entire marketplace… oncall runbooks, commit workflows, code review tools, investigation skills, experiment setup guides. The pattern is the same regardless of what the skill does.

Here’s how we think about designing them.

Principle 1: Know What the Agent Should NOT Decide
This might be the most important skill design principle, and it’s counterintuitive: the first thing to figure out is what to take away from the agent.

For Repo Readiness, I needed the scoring to be consistent. If you run it on the same repo twice and there have been no changes to that repo, you should get the same score. That sounds obvious, but LLMs don’t work that way. Ask an LLM to evaluate a repo and score it out of 100, you’ll get different numbers every time. It might feel generous on one run and strict on the next. You can’t trend scores over time, you can’t compare across teams, and you can’t trust the results.

So I moved all scoring into a standalone bash script. Every check is binary – pass or fail, with a fixed point value. No partial credit, no “almost there,” no vibes.

It doesn’t matter if you have one AI workflow or fifty, you get the same 20 points. This is intentional. Partial credit would require qualitative judgment (“is three workflows enough?”), and the moment you introduce that, you’ve reintroduced inconsistency.

The skill’s instructions explicitly tell the agent: “The script is the single source of truth for all scores. Never override, adjust, or recalculate any score from the script’s output.”

In Repo Readiness, the deterministic part is scoring. In other skills, it might be CLI commands, SQL queries, or naming conventions. Our Commit skill locks down the exact git commands to run. Our Experiment Setup skill prescribes the exact CLI invocations and flag naming format. Our Investigation skill hardcodes the SQL query structure so the agent can’t improvise something wrong.

The principle is the same everywhere: if it needs to be consistent across runs and across users, don’t leave it to the model. Put it in a script, a template, or a hard rule.

Principle 2: Know What the Agent SHOULD Decide
Just as important, what should the agent reason about? If you lock down everything, you’ve just built an expensive CLI tool with extra steps.

For Repo Readiness, the agent handles:

Interpretation — “Why did I fail the agent context check?” The agent reads the results, understands what agent context files are, and explains it in plain language for that specific user.
Action — “Can you look at my repo and suggest content for an AGENTS.md?” Now the agent reads the actual codebase, understands its structure, and generates a tailored file. No script can do that without an LLM.
Conversation — “What should I prioritize first?” The agent considers the point values, the team’s constraints, and gives a recommendation.
Basically, if the task requires understanding context, generating novel content, or having a conversation, that’s the agent’s job.

This gives you a clean two-zone architecture:

Zone Owner Why
Rules and execution Scripts, templates, hard rules Same input, same output – every time
Interpretation and action The agent Every repo is different; every conversation is different

Play to each system’s strengths.

This pattern shows up across all kinds of skills. Our Oncall skill runs a deterministic health check script, but leaves triage and diagnosis to the agent. The Investigation skill hardcodes the SQL query, but the agent interprets the results and decides what to do next. Our Code Review skill locks down the output format and independence rules, but leaves conflict resolution and judgment calls to the agent.

The split looks different for every skill, but the question is always the same: what needs to be consistent, and what needs to be smart?

Principle 3: Write a Constitution, Not a Suggestion
LLMs are people pleasers by nature. They want to be helpful, they want to soften bad news, they want to add caveats. “You scored 30 out of 100, but you’re really close on a few checks!” That’s nice, but it undermines the whole point of deterministic scoring.

The SKILL.md for Repo Readiness includes explicit rules:

Never override, adjust, or recalculate any score from the script
Never add or remove checks from the report
If the script says a check failed, show it as is
The specific formatting template to follow exactly, not approximately
This is defensive design against the agent’s helpfulness. The more specific your SKILL.md, the less the agent has to guess, and the more consistent the experience is for every user who triggers that skill.

This is the most universal of the three principles. Every skill we looked at across our marketplace benefits from constitutional constraints. Without these constraints, agents will find creative ways to be “helpful” that break your workflow. They’ll skip steps they think are unnecessary. They’ll soften results they think are too harsh. They’ll take actions they think you’d want without asking. Constitutional rules are how you channel that helpfulness into something reliable.

Think of the SKILL.md as a contract, not a suggestion. Be precise about the exact steps it should take and how to handle edge cases. Leave room for the agent to reason where reasoning adds value. Lock it down everywhere else.

Bonus: Design for the Arc
The three principles above apply to every skill. This one doesn’t, but when it fits, it’s the difference between a tool engineers use once and a tool they reach for every week.

The best skills aren’t one shot tools. They create a conversation arc.

Here’s what that looks like with Repo Readiness. I could have built it as a pure bash tool. It already produces a nicely structured JSON report. I could format that in the terminal with colors and tables and call it a day. But that would mean the workflow stops at the score.

As a skill, the script’s output becomes the agent’s input. The moment the agent shows you your score, it already has full context: what repo it analyzed, what checks passed and failed, what the specific recommendations are, and access to the repo’s actual code.

So when the report says “0 out of 15 on Agent Context — no AGENTS.md found,” you don’t have to open a browser, Google what that means, read some docs, then come back and write one yourself. You just say:

“What’s an AGENTS.md? Why do I need that?”

And then:

“Can you review my repo and take a first pass at drafting one?”

And the agent does it right there in the same session with full context. With their helpful nature, they’ll likely even offer it up as a suggestion before you even ask.

Then after collaborating with the agent, you can say “run the check again” and see your score improve in real time.

A script gives you a diagnosis. A skill gives you a diagnosis and a doctor who can treat you on the spot.

That being said, not every skill naturally creates this arc. A Commit skill is mostly one and done. But diagnostic skills, investigation tools, code review workflows, basically anything where results lead to action… these are the ones where designing for the arc pays off. When you’re building a skill like that, ask yourself: what will the user want to do after they see the first result? Then make sure the agent has what it needs to help with that too.

Skills aren’t complicated. They’re markdown files with instructions. But designing them well requires thinking about what should be deterministic versus what should be left for the agent to figure out, how specific your instructions need to be to get consistent results, and what the output enables in terms of next steps.

The principles:

Know what the agent should NOT decide: If it needs to be reproducible, put it in a script
Know what the agent SHOULD decide: Explanation, creation, and conversation are the agent’s strengths
Write a constitution: Be explicit about constraints; the agent will thank you by being consistent
Bonus: Design for the arc: The best skills turn output into input, making the agent more useful for whatever comes next
If your team has runbooks, processes, style guides, or any other knowledge that people keep having to re-explain, that’s a skill waiting to be written. We’re still early, but with 100+ skills, the pattern is clear: the teams that codify their knowledge into skills are the ones whose agents actually work.
