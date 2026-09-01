import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { benefitsTable } from "@workspace/db";
import {
  GetBenefitParams,
  GetBenefitResponse,
  ListBenefitsResponse,
  CheckEligibilityBody,
  CheckEligibilityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/benefits", async (_req, res): Promise<void> => {
  const rows = await db.select().from(benefitsTable).where(eq(benefitsTable.isActive, true));
  res.json(ListBenefitsResponse.parse(rows));
});

router.get("/benefits/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBenefitParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.select().from(benefitsTable).where(eq(benefitsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Benefit not found" });
    return;
  }

  res.json(GetBenefitResponse.parse(row));
});

router.post("/benefits/check-eligibility", async (req, res): Promise<void> => {
  const parsed = CheckEligibilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { employmentType, isBPL, hasAadhar, hasBankAccount, isFirstTwoLivebirths } = parsed.data;

  const benefits = await db.select().from(benefitsTable).where(eq(benefitsTable.isActive, true));

  const results = benefits.map(benefit => {
    let isEligible = false;
    let reason: string | null = null;

    if (benefit.schemeCode === "PMMVY") {
      isEligible = hasAadhar && hasBankAccount && isFirstTwoLivebirths;
      if (!isEligible) {
        if (!hasAadhar) reason = "Aadhaar card is required";
        else if (!hasBankAccount) reason = "Bank account is required";
        else reason = "Applicable for first two live births only";
      }
    } else if (benefit.schemeCode === "ESIC") {
      isEligible = employmentType === "private" || employmentType === "government";
      if (!isEligible) reason = "Applicable for employees in organised sector only";
    } else if (benefit.schemeCode === "MATERNITY_BENEFIT_ACT") {
      isEligible = employmentType === "private" || employmentType === "government";
      if (!isEligible) reason = "Applicable for employees in establishments with 10+ workers";
    } else if (benefit.schemeCode === "JSY") {
      isEligible = isBPL && hasAadhar;
      if (!isEligible) {
        if (!isBPL) reason = "Applicable for BPL families only";
        else reason = "Aadhaar card is required";
      }
    } else if (benefit.schemeCode === "NHM_ASHA") {
      isEligible = true;
    } else {
      isEligible = true;
    }

    return {
      benefitId: benefit.id,
      schemeName: benefit.schemeName,
      isEligible,
      reason,
      nextSteps: isEligible ? benefit.applicationSteps : [],
    };
  });

  res.json(CheckEligibilityResponse.parse(results));
});

export default router;
