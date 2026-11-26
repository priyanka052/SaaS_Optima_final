from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.db import Base


class CompanyTool(Base):
    __tablename__ = "company_tools"

    id = Column(Integer, primary_key=True, index=True)

    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=False)

    company_name = Column(String, nullable=False)

    plan_name = Column(String, nullable=False)

    seats = Column(Integer, nullable=False, default=1)

    price_per_seat = Column(Float, nullable=False)

    currency = Column(String, nullable=False, default="INR")

    billing_cycle = Column(String, nullable=False, default="monthly")