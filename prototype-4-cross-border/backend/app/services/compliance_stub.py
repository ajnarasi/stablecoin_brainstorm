"""Placeholder compliance checks for demo credibility.

Shows investors that Fiserv is thinking about regulatory compliance
even at the prototype stage. In production, this would integrate with
Fiserv's compliance infrastructure for OFAC, sanctions, and AML screening.
"""

from datetime import datetime, timezone
from decimal import Decimal

from app.models.schemas import ComplianceResult


class ComplianceStub:
    """Simulated compliance screening for cross-border transactions."""

    # Countries that would trigger enhanced due diligence in production
    ENHANCED_DUE_DILIGENCE_COUNTRIES: set[str] = {
        "IR", "KP", "SY", "CU", "VE",
    }

    async def screen_transaction(
        self,
        buyer_name: str,
        buyer_country: str,
        amount_usd: Decimal,
    ) -> ComplianceResult:
        """Simulated OFAC/sanctions screening.

        Always returns PASSED for demo purposes, but logs the check
        to demonstrate the compliance workflow. In production this would
        call Fiserv's compliance APIs for real-time screening.

        Args:
            buyer_name: Full name of the buyer.
            buyer_country: ISO 3166-1 alpha-2 country code.
            amount_usd: Transaction amount in USD for threshold checks.

        Returns:
            ComplianceResult with PASSED status and screening metadata.
        """
        screening_types = ["OFAC", "Sanctions"]

        if amount_usd >= Decimal("3000"):
            screening_types.append("Enhanced Due Diligence")

        if buyer_country in self.ENHANCED_DUE_DILIGENCE_COUNTRIES:
            screening_types.append("Country Risk Assessment")

        return ComplianceResult(
            status="PASSED",
            screening_type=" + ".join(screening_types),
            buyer_name=buyer_name,
            buyer_country=buyer_country,
            timestamp=datetime.now(timezone.utc),
            note=(
                "Simulated screening - production will use "
                "Fiserv compliance infrastructure"
            ),
        )
