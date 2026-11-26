from fastapi import APIRouter, Query

from app.db import SessionLocal
from app.models.tool import Tool
from app.models.pricing import Pricing
from app.ml.overlap import jaccard_similarity, parse_features
from app.models.company_tool import CompanyTool

router = APIRouter(
    prefix="/api/overlap",
    tags=["overlap"]
)


@router.get("")
def get_overlap(
    threshold: float = Query(
        default=0.0,
        ge=0.0,
        le=100.0
    )
):
    with SessionLocal() as session:
        tools = session.query(Tool).all()

        results = []

        for i in range(len(tools)):
            for j in range(i + 1, len(tools)):
                tool_a = tools[i]
                tool_b = tools[j]

                features_a = parse_features(tool_a.features)
                features_b = parse_features(tool_b.features)

                score = jaccard_similarity(features_a, features_b)
                similarity = round(score * 100, 2)

                if similarity < threshold:
                    continue

                # Get the cheapest available monthly price
                # for each tool.
                pricing_a = (
                    session.query(Pricing)
                    .filter(
                        Pricing.tool_id == tool_a.id,
                        Pricing.billing_period == "monthly"
                    )
                    .order_by(Pricing.price.asc())
                    .first()
                )

                pricing_b = (
                    session.query(Pricing)
                    .filter(
                        Pricing.tool_id == tool_b.id,
                        Pricing.billing_period == "monthly"
                    )
                    .order_by(Pricing.price.asc())
                    .first()
                )

                # Use the Pricing table when available.
                # Fall back to the old Tool.price_inr field.
                price_a = pricing_a.price if pricing_a else tool_a.price_inr
                price_b = pricing_b.price if pricing_b else tool_b.price_inr

                if price_a is not None and price_b is not None:
                    if price_a <= price_b:
                        recommended_tool = tool_a.name
                        potential_savings = round(price_b - price_a, 2)
                    else:
                        recommended_tool = tool_b.name
                        potential_savings = round(price_a - price_b, 2)
                else:
                    recommended_tool = None
                    potential_savings = None

                results.append({
                    "tool_a": tool_a.name,
                    "tool_b": tool_b.name,
                    "similarity": similarity,
                    "price_a": price_a,
                    "price_b": price_b,
                    "recommended_tool": recommended_tool,
                    "potential_monthly_savings": potential_savings
                })

        return results


@router.get("/company")
def get_company_overlap(
    company_name: str = Query(default="Demo Company"),
    threshold: float = Query(default=20.0, ge=0.0, le=100.0)
):
    with SessionLocal() as session:

        subscriptions = (
            session.query(CompanyTool, Tool)
            .join(Tool, CompanyTool.tool_id == Tool.id)
            .filter(CompanyTool.company_name == company_name)
            .all()
        )

        results = []

        for i in range(len(subscriptions)):
            for j in range(i + 1, len(subscriptions)):

                subscription_a, tool_a = subscriptions[i]
                subscription_b, tool_b = subscriptions[j]

                features_a = parse_features(tool_a.features)
                features_b = parse_features(tool_b.features)

                score = jaccard_similarity(features_a, features_b)
                similarity = round(score * 100, 2)

                if similarity < threshold:
                    continue

                # Calculate monthly subscription cost
                monthly_a = subscription_a.seats * subscription_a.price_per_seat
                monthly_b = subscription_b.seats * subscription_b.price_per_seat

                if subscription_a.billing_cycle == "annually":
                    monthly_a /= 12

                if subscription_b.billing_cycle == "annually":
                    monthly_b /= 12

                monthly_a = round(monthly_a, 2)
                monthly_b = round(monthly_b, 2)

                # Only compare costs in the same currency
                if subscription_a.currency != subscription_b.currency:
                    cheaper_tool = None
                    potential_savings = None

                elif monthly_a <= monthly_b:
                    cheaper_tool = tool_a.name
                    potential_savings = monthly_b

                else:
                    cheaper_tool = tool_b.name
                    potential_savings = monthly_a

                results.append({
                    "tool_a": tool_a.name,
                    "tool_b": tool_b.name,
                    "similarity": similarity,
                    "monthly_cost_a": monthly_a,
                    "monthly_cost_b": monthly_b,
                    "currency_a": subscription_a.currency,
                    "currency_b": subscription_b.currency,
                    "cheaper_tool": cheaper_tool,
                    "potential_monthly_savings": potential_savings
                })

        return results