# Tool Use Patterns

## Overview

Tool use (function calling) enables LLMs to interact with external systems by generating structured tool invocations. This reference covers tool definition, invocation patterns, multi-turn orchestration, error handling, and safety guardrails for agent systems.

## Tool Definition Best Practices

### Anatomy of a Tool Definition

Every tool needs four elements:

```json
{
  "name": "search_documents",
  "description": "Search the knowledge base for documents matching a query. Use when the user asks a question that requires looking up information. Do NOT use for general conversation.",
  "parameters": {
    "type": "object",
    "required": ["query"],
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query. Use specific keywords, not full sentences."
      },
      "limit": {
        "type": "integer",
        "description": "Maximum number of results to return. Default: 5.",
        "default": 5,
        "minimum": 1,
        "maximum": 20
      },
      "filter_type": {
        "type": "string",
        "enum": ["all", "api_reference", "tutorial", "faq"],
        "description": "Filter results by document type. Default: all."
      }
    }
  }
}
```

### Naming Conventions

| Pattern | Example | Use case |
|---------|---------|----------|
| verb_noun | `search_documents`, `create_ticket` | Action on a resource |
| get_noun | `get_user_profile`, `get_order_status` | Read-only data retrieval |
| noun_action | `database_query`, `file_read` | When the resource is the primary concept |

**Consistency matters.** If some tools use `verb_noun` and others use `noun_verb`, the model will occasionally swap arguments between similarly-named tools.

### Description Quality

The description is the most important field. It determines when the model chooses to invoke the tool.

**Bad:** `"Search documents"` -- too vague, model does not know when to use it.

**Good:** `"Search the knowledge base for documents matching a query. Use when the user asks a question that requires looking up factual information. Do NOT use for greetings, opinions, or general conversation."`

Include:
1. What the tool does (one sentence).
2. When to use it (one sentence with specific trigger conditions).
3. When NOT to use it (one sentence with explicit exclusions).

### Parameter Descriptions

Each parameter description should explain the expected format and any constraints.

**Bad:** `"query": {"description": "The query"}`

**Good:** `"query": {"description": "The search query. Use 2-5 specific keywords extracted from the user's question. Do not pass the user's full message as the query."}`

## Invocation Patterns

### Single Tool Call

The model calls one tool and uses the result to form a response.

```
User: "What is the status of order #12345?"

Model thinking: I need to look up the order status.
Tool call: get_order_status(order_id="12345")
Tool result: {"status": "shipped", "tracking": "1Z999AA10123456784", "eta": "2025-03-15"}

Model response: "Your order #12345 has been shipped. Tracking number: 1Z999AA10123456784. Expected delivery: March 15, 2025."
```

### Parallel Tool Calls

The model calls multiple tools simultaneously when the results are independent.

```
User: "Compare the pricing and features of Plan A and Plan B."

Tool calls (parallel):
  get_plan_details(plan_name="Plan A")
  get_plan_details(plan_name="Plan B")

Tool results:
  Plan A: {"price": 29, "features": ["5 users", "10GB storage"]}
  Plan B: {"price": 49, "features": ["25 users", "100GB storage", "priority support"]}

Model response: [comparison table]
```

### Sequential Tool Calls (Chaining)

The model calls one tool, uses the result to decide the next tool call.

```
User: "Find the customer who placed order #12345 and check their account balance."

Step 1: get_order_details(order_id="12345") -> {"customer_id": "C-789"}
Step 2: get_customer_balance(customer_id="C-789") -> {"balance": 142.50}

Model response: "Order #12345 was placed by customer C-789. Their current account balance is $142.50."
```

### Conditional Tool Use

The model decides whether to use a tool based on the query.

```
User: "Hello, how are you?"
Model response: "Hello! I'm doing well. How can I help you today?"
(No tool call -- greeting does not require data lookup)

User: "What's my account balance?"
Tool call: get_account_balance(user_id="current_user")
(Tool call triggered by data-dependent question)
```

## Multi-Turn Orchestration

### Agentic Loop

For complex tasks, the model operates in a loop: observe, decide, act, observe.

```python
async def agent_loop(user_message: str, tools: list[dict], max_steps: int = 10) -> str:
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]

    for step in range(max_steps):
        response = await call_llm(messages, tools=tools)

        # Check if the model wants to call a tool
        if response.tool_calls:
            for tool_call in response.tool_calls:
                result = await execute_tool(tool_call)
                messages.append({"role": "assistant", "content": None, "tool_calls": [tool_call]})
                messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": result})
        else:
            # Model produced a final response
            return response.content

    return "I was unable to complete the task within the step limit."
```

### Planning Before Acting

For complex tasks, instruct the model to plan before making tool calls.

```
Before calling any tools, create a plan:

1. List the information you need to answer the user's question.
2. Identify which tools can provide each piece of information.
3. Determine the optimal order of tool calls (parallel where possible).
4. Execute the plan.
5. Synthesize the results into a response.
```

## Error Handling

### Tool Execution Failures

```python
async def execute_tool_safely(tool_call: dict) -> str:
    """Execute a tool call with error handling."""
    try:
        result = await execute_tool(tool_call)
        return json.dumps(result)
    except ToolNotFoundError:
        return json.dumps({"error": f"Tool '{tool_call.name}' does not exist."})
    except ValidationError as e:
        return json.dumps({"error": f"Invalid arguments: {e.message}"})
    except TimeoutError:
        return json.dumps({"error": "Tool execution timed out. Try again or use a different approach."})
    except Exception as e:
        return json.dumps({"error": f"Tool execution failed: {str(e)}"})
```

### Guiding Recovery

Include error-handling instructions in the system prompt:

```
If a tool call fails:
1. Report the error to the user in plain language.
2. Suggest an alternative approach if one exists.
3. Do NOT retry the same tool call with the same arguments more than once.
4. If multiple tools fail, inform the user and offer to help manually.
```

## Safety Guardrails

### Tool Allowlisting

Only expose tools that the current user is authorized to use.

```python
def filter_tools_for_user(all_tools: list[dict], user_role: str) -> list[dict]:
    """Filter tools based on user role."""
    role_permissions = {
        "viewer": {"search_documents", "get_status"},
        "editor": {"search_documents", "get_status", "update_document"},
        "admin": {"search_documents", "get_status", "update_document", "delete_document"}
    }
    allowed = role_permissions.get(user_role, set())
    return [t for t in all_tools if t["function"]["name"] in allowed]
```

### Argument Validation

Validate tool arguments before execution, not just after.

```python
def validate_tool_args(tool_name: str, args: dict) -> dict:
    """Validate and sanitize tool arguments."""
    schema = TOOL_SCHEMAS[tool_name]
    jsonschema.validate(args, schema)

    # Additional safety checks
    for key, value in args.items():
        if isinstance(value, str):
            # Prevent path traversal
            if ".." in value or value.startswith("/"):
                raise SecurityError(f"Unsafe argument value for {key}: {value}")
            # Prevent SQL injection (if applicable)
            if any(kw in value.upper() for kw in ["DROP", "DELETE", "UPDATE", "INSERT"]):
                raise SecurityError(f"Potentially unsafe SQL in {key}: {value}")

    return args
```

### Rate Limiting

Prevent the model from making excessive tool calls.

```python
class ToolRateLimiter:
    def __init__(self, max_calls_per_turn: int = 5, max_calls_per_session: int = 50):
        self.max_per_turn = max_calls_per_turn
        self.max_per_session = max_calls_per_session
        self.turn_count = 0
        self.session_count = 0

    def check(self) -> bool:
        if self.turn_count >= self.max_per_turn:
            raise RateLimitError("Maximum tool calls per turn reached.")
        if self.session_count >= self.max_per_session:
            raise RateLimitError("Maximum tool calls per session reached.")
        self.turn_count += 1
        self.session_count += 1
        return True

    def reset_turn(self):
        self.turn_count = 0
```

### Confirmation for Destructive Actions

For tools that modify data, require explicit confirmation.

```
## Tool Use Rules

For READ operations (search, get, list): execute immediately.
For WRITE operations (create, update): execute immediately if the user's intent is clear.
For DELETE operations: ALWAYS confirm with the user before executing.
  Example: "I'm about to delete document X. This cannot be undone. Should I proceed?"
```

## Common Pitfalls

| Pitfall | Cause | Fix |
|---------|-------|-----|
| Over-invocation | Tool description too broad | Add "Do NOT use for..." exclusions |
| Under-invocation | Tool description too narrow | Add trigger conditions and examples |
| Wrong arguments | Parameter descriptions vague | Add format examples to each parameter |
| Infinite loops | Model retries failed calls | Add max retries and loop detection |
| Hallucinated tools | Model invents tool names | Validate tool name before execution |
| Data leakage | Tool returns sensitive data to model | Filter tool results before returning to model |
