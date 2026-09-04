# ==============================================================================
# E-Commerce Big Data Analytics Pipeline - Apache Hadoop & PySpark Dockerfile
# ==============================================================================

FROM python:3.10-slim-bullseye

# Install OpenJDK-11, curl, netcat, and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-11-jdk-headless \
    curl \
    netcat-openbsd \
    procps \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# Environment variables for Java & Hadoop
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
ENV HADOOP_VERSION=3.3.6
ENV HADOOP_HOME=/opt/hadoop
ENV HADOOP_CONF_DIR=$HADOOP_HOME/etc/hadoop
ENV PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$JAVA_HOME/bin

# Download and install Apache Hadoop
RUN (curl -sSL --fail https://dlcdn.apache.org/hadoop/common/hadoop-${HADOOP_VERSION}/hadoop-${HADOOP_VERSION}.tar.gz || \
     curl -sSL --fail https://downloads.apache.org/hadoop/common/hadoop-${HADOOP_VERSION}/hadoop-${HADOOP_VERSION}.tar.gz || \
     curl -sSL https://archive.apache.org/dist/hadoop/common/hadoop-${HADOOP_VERSION}/hadoop-${HADOOP_VERSION}.tar.gz) | tar -xz -C /opt/ \
 && mv /opt/hadoop-${HADOOP_VERSION} /opt/hadoop \
 && mkdir -p /hadoop/dfs/name /hadoop/dfs/data /hadoop/data/tmp

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --default-timeout=1000 --retries 10 --no-cache-dir -r requirements.txt -i https://pypi.org/simple --extra-index-url https://pypi.tuna.tsinghua.edu.cn/simple

# Copy Hadoop XML config files into HADOOP_CONF_DIR
COPY hadoop-config/* $HADOOP_CONF_DIR/

# Copy application source code and scripts
COPY . /app

# Ensure entrypoint is executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 9870 9864 8088 9000 8501

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["runner"]
