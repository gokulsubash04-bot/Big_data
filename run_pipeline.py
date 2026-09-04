# ==============================================================================
# Master Python Pipeline Execution Launcher
# Runs the full E-Commerce Big Data Analytics Workflow
# ==============================================================================

import os
import sys
import time
import subprocess


def run_script(script_path, args=None):
    print(f"---> Executing: {script_path}")
    cmd = [sys.executable, script_path] + (args if args else [])
    res = subprocess.run(cmd, check=True)
    return res.returncode == 0


def main():
    print("******************************************************************")
    print("  LAUNCHING E-COMMERCE CUSTOMER BEHAVIOR ANALYTICS PIPELINE")
    print("******************************************************************\n")

    start_time = time.time()
    main_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "main.py")

    try:
        run_script(main_script, sys.argv[1:])

        elapsed = time.time() - start_time
        print("******************************************************************")
        print(f"  PIPELINE COMPLETED SUCCESSFULLY IN {elapsed:.2f} SECONDS!")
        print("******************************************************************\n")
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Pipeline execution failed with return code {e.returncode}")
        sys.exit(e.returncode)


if __name__ == "__main__":
    main()
