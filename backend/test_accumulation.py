import json

# This creates a project with TWO major flags:
# 1. Bad Contractor (+80)
# 2. Missing Location (+30)
# Expected Score: 110 (Capped at 100)

test_data = [
    {
        "ProjectID": "TEST-MATH-001",
        "ProjectDescription": "TEST ACCUMULATION LOGIC",
        "InfraYear": 2023,
        "Contractor": "SYMS CONSTRUCTION TRADING",  # Flag: +80
        "Municipality": "",  # Flag: +30 (Missing)
        "Province": "",     # Flag: +30 (Missing)
        "ContractCost": 5000000,
        "StartDate": "2023-01-01",
        "CompletionDateActual": "2023-12-31"
    }
]

with open("flood_control_raw_projects.json", "w") as f:
    json.dump(test_data, f)

print("✅ Created test data.")
print("Now run: python main.py")
print("If the score is 100 (and not 80), the math is working.")
