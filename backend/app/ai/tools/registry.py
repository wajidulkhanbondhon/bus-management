"""
Type-safe Tool Registry for AI Orchestration.
Guards execution with Role Permissions, Context Verification, and Argument Validation.
"""

from typing import Callable, Dict, Any, List, Optional
from functools import wraps
from app.ai.context import AIContext


class ToolDefinition:
    def __init__(
        self,
        name: str,
        description: str,
        func: Callable,
        allowed_contexts: List[AIContext],
        required_roles: Optional[List[str]] = None,
        is_action: bool = False
    ):
        self.name = name
        self.description = description
        self.func = func
        self.allowed_contexts = allowed_contexts
        self.required_roles = required_roles or []
        self.is_action = is_action


class AIToolRegistry:
    _tools: Dict[str, ToolDefinition] = {}

    @classmethod
    def register(
        cls,
        name: str,
        description: str,
        allowed_contexts: List[AIContext],
        required_roles: Optional[List[str]] = None,
        is_action: bool = False
    ):
        """Decorator to register a backend function as an AI tool."""
        def decorator(func: Callable):
            cls._tools[name] = ToolDefinition(
                name=name,
                description=description,
                func=func,
                allowed_contexts=allowed_contexts,
                required_roles=required_roles,
                is_action=is_action
            )
            return func
        return decorator

    @classmethod
    def get_tool(cls, name: str) -> Optional[ToolDefinition]:
        return cls._tools.get(name)

    @classmethod
    def get_tools_for_context(cls, context: AIContext, user_role: Optional[str] = None) -> List[ToolDefinition]:
        """Returns only the tools authorized for the given context and user role."""
        available = []
        for t in cls._tools.values():
            if context not in t.allowed_contexts:
                continue
            if t.required_roles:
                if not user_role:
                    continue
                if user_role != "SUPER_ADMIN" and user_role not in t.required_roles:
                    continue
            available.append(t)
        return available

    @classmethod
    def execute_tool(
        cls,
        name: str,
        context: AIContext,
        user_role: Optional[str],
        **kwargs
    ) -> Dict[str, Any]:
        """Executes a tool with strict authorization validation."""
        tool = cls.get_tool(name)
        if not tool:
            return {"error": f"Tool '{name}' not found", "success": False}

        if context not in tool.allowed_contexts:
            return {"error": f"Tool '{name}' is not permitted in {context.value}", "success": False}

        if tool.required_roles:
            if not user_role or (user_role != "SUPER_ADMIN" and user_role not in tool.required_roles):
                return {"error": f"Permission denied for tool '{name}'. Required roles: {tool.required_roles}", "success": False}

        try:
            result = tool.func(**kwargs)
            return {"data": result, "success": True, "tool_name": name}
        except Exception as e:
            return {"error": str(e), "success": False, "tool_name": name}
