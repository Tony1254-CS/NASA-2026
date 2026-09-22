import sys
from pathlib import Path

# Ensure server directory is in sys.path so 'app...' package imports resolve correctly
_server_root = Path(__file__).resolve().parent.parent
if str(_server_root) not in sys.path:
    sys.path.insert(0, str(_server_root))
