from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.company_tool import CompanyTool
from app.models.tool import Tool

router = APIRouter(
    prefix="/api/company-tools",
    tags=["company tools"]
)


@router.post("")
def add_company_tool(data: dict):
    with SessionLocal() as session:
        tool = session.query(Tool).filter(
            Tool.id == data["tool_id"]
        ).first()

        if not tool:
            return {"error": "Tool not found"}

        company_tool = CompanyTool(
            tool_id=data["tool_id"],
            company_name=data["company_name"],
            plan_name=data["plan_name"],
            seats=data["seats"],
            price_per_seat=data["price_per_seat"],
            currency=data.get("currency", "INR"),
            billing_cycle=data.get("billing_cycle", "monthly")
        )

        session.add(company_tool)
        session.commit()
        session.refresh(company_tool)

        return {
            "message": "Tool added to company stack successfully",
            "id": company_tool.id
        }


@router.get("")
def get_company_tools(company_name: str):
    with SessionLocal() as session:
        subscriptions = session.query(CompanyTool).filter(
            CompanyTool.company_name == company_name
        ).all()

        results = []

        for subscription in subscriptions:
            tool = session.query(Tool).filter(
                Tool.id == subscription.tool_id
            ).first()

            if tool:
                results.append({
                    "subscription_id": subscription.id,
                    "tool_name": tool.name,
                    "category": tool.category,
                    "plan_name": subscription.plan_name,
                    "seats": subscription.seats,
                    "price_per_seat": subscription.price_per_seat,
                    "currency": subscription.currency,
                    "billing_cycle": subscription.billing_cycle
                })

        return results

@router.delete("/{subscription_id}")
def delete_company_tool(subscription_id: int):
    with SessionLocal() as session:
        subscription = session.query(CompanyTool).filter(
            CompanyTool.id == subscription_id
        ).first()

        if not subscription:
            return {"error": "Subscription not found"}

        session.delete(subscription)
        session.commit()

        return {"message": "Subscription removed successfully"}



@router.get("/summary")
def get_company_summary(company_name: str):
    with SessionLocal() as session:
        subscriptions = session.query(CompanyTool).filter(
            CompanyTool.company_name == company_name
        ).all()

        monthly_total = 0
        total_seats = 0

        for subscription in subscriptions:
            cost = subscription.seats * subscription.price_per_seat

            if subscription.billing_cycle.lower() == "annually":
                monthly_total += cost / 12
            else:
                monthly_total += cost

            total_seats += subscription.seats

        return {
            "company_name": company_name,
            "total_subscriptions": len(subscriptions),
            "total_seats": total_seats,
            "monthly_spend": round(monthly_total, 2),
            "annual_spend": round(monthly_total * 12, 2)
        }