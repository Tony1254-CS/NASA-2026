import sys
from pathlib import Path

# Ensure monorepo root is in sys.path so 'server.app...' package imports resolve correctly
# regardless of whether commands are launched from workspace root or inside server/ directory.
_monorepo_root = Path(__file__).resolve().parent.parent.parent
if str(_monorepo_root) not in sys.path:
    sys.path.insert(0, str(_monorepo_root))
