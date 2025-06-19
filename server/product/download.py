from sentence_transformers import SentenceTransformer
import os

# Create directory
os.makedirs('src/main/resources/models/embeddings', exist_ok=True)

# Download and save model
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
model.save('src/main/resources/models/embeddings/sentence-transformer-model')

print("Model downloaded successfully!")