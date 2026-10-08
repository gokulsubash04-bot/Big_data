# ==============================================================================
# Master Python Pipeline Execution Launcher
# Runs the full E-Commerce Big Data Analytics Workflow
# ==============================================================================

import os
import sys
import time
import subprocess


def run_script(script_path, args=None):
    """Execute python script safely and monitor return code."""
    print(f"---> Executing: {script_path}")
    cmd = [sys.executable, script_path] + (args if args else [])
    res = subprocess.run(cmd, check=True)
    return res.returncode == 0


def main():
    print("******************************************************************")
    print("  LAUNCHING E-COMMERCE CUSTOMER BEHAVIOR ANALYTICS PIPELINE")
    print("******************************************************************\n")

    start_time = time.time()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    main_script = os.path.join(base_dir, "src", "main.py")

    if not os.path.exists(main_script):
        print(f"[ERROR] Master pipeline script not found at {main_script}")
        sys.exit(1)

    try:
        run_script(main_script, sys.argv[1:])

        elapsed = time.time() - start_time
        print("******************************************************************")
        print(f"  PIPELINE COMPLETED SUCCESSFULLY IN {elapsed:.2f} SECONDS!")
        print("******************************************************************\n")
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Pipeline execution failed with return code {e.returncode}")
        sys.exit(e.returncode)
    except Exception as e:
        print(f"\n[ERROR] Pipeline execution encountered an unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
