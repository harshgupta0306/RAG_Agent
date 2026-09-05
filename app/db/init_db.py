from app.db.base import Base
from app.db.database import engine
from app.db.models import Notebook


Base.metadata.create_all(bind=engine)

print("Database tables created.")