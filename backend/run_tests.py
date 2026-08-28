import sys
import io

# Force UTF-8 output encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

sys.path.insert(0, 'backend')
from tests.test_ai_orchestration import (
    test_office_ai_today_sales,
    test_office_ai_profit_analysis,
    test_student_ai_my_bus,
    test_prompt_injection_defense
)

if __name__ == "__main__":
    print("Running AI Orchestration Test Suite...")
    test_office_ai_today_sales()
    print("✓ Office AI: Today Sales Test Passed")
    test_office_ai_profit_analysis()
    print("✓ Office AI: Profit & Loss Analysis Test Passed")
    test_student_ai_my_bus()
    print("✓ Student AI: My Bus & Personal Info Test Passed")
    test_prompt_injection_defense()
    print("✓ Security: Prompt Injection Defense Test Passed")
    print("\n🎉 ALL 4 AI ORCHESTRATION TESTS PASSED 100%!")
