# Example: Multi-Turn Tool-Use Prompt with Chain-of-Thought

## Context

An engineering team is building an AI agent that helps data analysts write SQL queries. The agent can call a `describe_table` tool to inspect schema and a `run_query` tool to execute queries. It needs chain-of-thought to decompose complex analytical questions.

## User Prompt

> Design a prompt for an AI SQL assistant that uses tool calls. It should: think step-by-step before writing SQL, call describe_table to check schema before assuming column names, validate query results against the original question, and handle cases where the data doesn't contain what the user needs. Include few-shot examples.

## Skill Response

### Task Contract

- **Input:** A natural-language analytical question about a database.
- **Output:** A validated SQL query with explanation, or a clarification request if the data cannot answer the question.
- **Success Criteria:** The generated SQL returns the correct result set for the question; the reasoning trace is auditable.
- **Failure Modes:** Assuming column names without schema lookup; generating syntactically valid but semantically wrong SQL; not validating results.

### System Prompt

```xml
<role>
You are a SQL analyst assistant. You help data analysts write correct, efficient SQL queries by reasoning through the problem step-by-step and verifying your assumptions against the actual schema.
</role>

<tools>
- describe_table(table_name: str) -> Returns column names, types, sample values, and row count.
- run_query(sql: str) -> Executes SQL and returns up to 100 result rows.
</tools>

<workflow>
For every user question, follow this sequence:

1. UNDERSTAND: Restate the user's question in your own words. Identify the metrics, dimensions, and filters needed.
2. DISCOVER: Call describe_table for every table you plan to use. Never assume column names or types.
3. PLAN: Write a step-by-step query plan mapping each part of the question to SQL operations (JOIN, WHERE, GROUP BY, etc.).
4. WRITE: Generate the SQL query based on your plan and the actual schema.
5. VALIDATE: Call run_query to execute. Check that the result answers the original question. If results are empty or unexpected, investigate and revise.
6. EXPLAIN: Provide the final query with a plain-language explanation of what each clause does.
</workflow>

<constraints>
- Never write SQL without first calling describe_table for the relevant tables.
- If the schema does not contain the data needed to answer the question, say so explicitly and suggest what data would be needed.
- Always show your reasoning before the final query.
</constraints>
```

### Few-Shot Examples

**Example 1: Simple aggregation (typical case)**

User: "What was the total revenue last month?"

```
UNDERSTAND: The user wants the sum of revenue for the previous calendar month.

DISCOVER: Let me check the schema.
[Tool call: describe_table("orders")]
-> columns: id (int), customer_id (int), amount (decimal), created_at (timestamp), status (varchar)

PLAN:
1. Filter orders to last month using created_at
2. Sum the amount column
3. Filter to completed orders only (status = 'completed')

WRITE:
SELECT SUM(amount) AS total_revenue
FROM orders
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  AND created_at < DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'completed';

[Tool call: run_query(<above SQL>)]
-> total_revenue: 142,350.00

VALIDATE: Result is a single number representing last month's revenue from completed orders. This answers the question.

EXPLAIN: This query sums the `amount` column from the `orders` table for all completed orders created in the previous calendar month.
```

**Example 2: Missing data (edge case)**

User: "What's the average customer satisfaction score by product?"

```
UNDERSTAND: The user wants average satisfaction scores grouped by product.

DISCOVER:
[Tool call: describe_table("products")]
-> columns: id (int), name (varchar), category (varchar), price (decimal)
[Tool call: describe_table("orders")]
-> columns: id (int), customer_id (int), product_id (int), amount (decimal), created_at (timestamp)

I checked both relevant tables. Neither contains a satisfaction score column, and no survey or feedback table exists in the schema.

ANSWER: The current database does not contain customer satisfaction data. To answer this question, you would need a table like `customer_feedback` with columns for `product_id`, `customer_id`, and `satisfaction_score`. Consider integrating data from your survey tool (e.g., Typeform, Delighted) into the database.
```

### Chain-of-Thought Design Notes

| Decision | Rationale |
|----------|-----------|
| XML delimiters | XML tags provide unambiguous section boundaries that models follow more reliably than Markdown in multi-section prompts. |
| 6-step workflow | The UNDERSTAND-DISCOVER-PLAN-WRITE-VALIDATE-EXPLAIN sequence forces schema verification before SQL generation and result validation after. |
| Tool call before SQL | Making schema lookup mandatory prevents the most common failure: assuming column names that don't exist. |
| Edge-case few-shot | The missing-data example teaches graceful failure, which zero-shot prompts rarely handle. |
| Constraint ordering | The most critical constraint (no SQL without describe_table) comes first for maximum attention. |

### Key Decisions

1. **Explicit workflow over implicit reasoning** -- Rather than "think step by step," the prompt names each step. Named steps are more reliably followed than generic chain-of-thought instructions.
2. **Two few-shot examples at the decision boundary** -- Example 1 covers the happy path; Example 2 covers the most important failure mode (missing data). Two examples are sufficient because the workflow structure carries most of the behavioral guidance.
3. **XML over Markdown for system prompt** -- Multi-section prompts with tools, workflows, and constraints benefit from XML's explicit open/close tags, which reduce section-bleed where the model confuses one section's instructions with another's.
4. **Validate step prevents silent errors** -- Without explicit validation, the model generates plausible-looking SQL that may return wrong results. The run_query + check step catches semantic errors.
