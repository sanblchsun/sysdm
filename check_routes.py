import sys
sys.path.append('.')
from app.main import app

print("\n" + "="*60)
print("Registered routes in FastAPI app:")
for route in app.routes:
    if hasattr(route, "path"):
        methods = list(route.methods) if hasattr(route, "methods") else []
        print(f"  {route.path} - {methods}")
print("="*60)