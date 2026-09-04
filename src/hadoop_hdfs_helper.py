# ==============================================================================
# Hadoop HDFS Integration Module
# Provides Utilities for File Operations & PySpark Integration on HDFS
# ==============================================================================

import os
import sys
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

HDFS_NAMENODE_URL = os.environ.get("HDFS_NAMENODE", "hdfs://namenode:9000")


def is_hadoop_environment():
    """Check if execution environment is configured for Hadoop / Docker cluster."""
    hadoop_home = os.environ.get("HADOOP_HOME")
    if hadoop_home and os.path.exists(os.path.join(hadoop_home, "bin", "hdfs")):
        return True
    return False


def run_hdfs_command(cmd_args):
    """Execute an hdfs CLI command if Hadoop is installed."""
    if not is_hadoop_environment():
        logging.warning("Hadoop CLI not detected in PATH/HADOOP_HOME. Skipping HDFS execution.")
        return False
    try:
        full_cmd = ["hdfs", "dfs"] + cmd_args
        logging.info(f"Running HDFS Command: {' '.join(full_cmd)}")
        res = subprocess.run(full_cmd, capture_output=True, text=True, check=True)
        return res.returncode == 0
    except Exception as e:
        logging.error(f"HDFS Command failed: {e}")
        return False


def sync_local_data_to_hdfs(local_dir, hdfs_raw_dir="/ecommerce/raw"):
    """Upload local CSV files into HDFS storage directory."""
    if not is_hadoop_environment():
        return False

    run_hdfs_command(["-mkdir", "-p", hdfs_raw_dir])
    for fname in os.listdir(local_dir):
        if fname.endswith(".csv"):
            local_file = os.path.join(local_dir, fname)
            hdfs_dest = f"{hdfs_raw_dir}/{fname}"
            logging.info(f"Uploading local file {fname} to HDFS destination {hdfs_dest}")
            run_hdfs_command(["-put", "-f", local_file, hdfs_dest])
    return True


def get_hdfs_path(relative_path):
    """Return full HDFS URI string or local fallback path."""
    if is_hadoop_environment():
        return f"{HDFS_NAMENODE_URL}{relative_path}"
    return relative_path
