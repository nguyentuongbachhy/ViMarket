from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.review import Base

engine = create_engine(settings.databaseUrl)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def createTables():
    Base.metadata.create_all(bind=engine)

def getDb():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()