from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from app.db.session import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class KnowledgeRule(Base):
    __tablename__ = "ai_knowledge_rules"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    topic_keywords = Column(Text, nullable=False, index=True)
    content = Column(Text, nullable=False)
    # Storing allowed roles as a comma-separated string to support SQLite fallback in local dev, 
    # since ARRAY is postgres specific and might cause issues in test suite.
    allowed_roles_csv = Column(String, nullable=False, default="ALL") 
    added_by = Column(String(36), nullable=True)  # User ID of the admin who added it

    @property
    def allowed_roles(self):
        return [r.strip() for r in self.allowed_roles_csv.split(",")]

    @allowed_roles.setter
    def allowed_roles(self, roles_list):
        self.allowed_roles_csv = ",".join(roles_list)
