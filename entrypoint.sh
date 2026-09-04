#!/bin/bash
set -e

ROLE=$1

case "$ROLE" in
  namenode)
    if [ ! -d "/hadoop/dfs/name/current" ]; then
      echo "=== Formatting HDFS NameNode ==="
      $HADOOP_HOME/bin/hdfs namenode -format -force -nonInteractive
    fi
    echo "=== Starting HDFS NameNode ==="
    exec $HADOOP_HOME/bin/hdfs namenode
    ;;

  datanode)
    echo "=== Starting HDFS DataNode ==="
    exec $HADOOP_HOME/bin/hdfs datanode
    ;;

  resourcemanager)
    echo "=== Starting YARN ResourceManager ==="
    exec $HADOOP_HOME/bin/yarn resourcemanager
    ;;

  nodemanager)
    echo "=== Starting YARN NodeManager ==="
    exec $HADOOP_HOME/bin/yarn nodemanager
    ;;

  runner)
    echo "=== Waiting for Hadoop NameNode to become available ==="
    until nc -z namenode 9000; do
      echo "Waiting for HDFS NameNode on port 9000..."
      sleep 3
    done

    echo "=== Initializing HDFS Directories ==="
    $HADOOP_HOME/bin/hdfs dfs -mkdir -p /ecommerce/raw
    $HADOOP_HOME/bin/hdfs dfs -mkdir -p /ecommerce/processed
    $HADOOP_HOME/bin/hdfs dfs -chmod -R 777 /ecommerce

    echo "=== Executing Big Data Analytics Pipeline on Hadoop ==="
    exec python run_pipeline.py --use-hadoop
    ;;

  dashboard)
    echo "=== Starting E-Commerce Analytics Web Dashboard Server ==="
    exec python app.py
    ;;

  *)
    echo "Usage: entrypoint.sh {namenode|datanode|resourcemanager|nodemanager|runner|dashboard}"
    exec "$@"
    ;;
esac
