# Use an official TensorFlow runtime with GPU support as the base image
FROM tensorflow/tensorflow:latest-gpu

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the local directory contents to the container's working directory
COPY . /usr/src/app

# Install necessary OS packages
# Corrected the RUN command to properly install packages and clean up in one layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Use `pip install --no-cache-dir` to avoid storing the pip cache in the Docker image
RUN pip install --ignore-installed --no-cache-dir blinker && \
    pip install -r requirements.txt

# Expose port 5000 to the host and any other network connected to this container
EXPOSE 5000

# Command to run when starting the container
CMD ["python", "llm.py"]
