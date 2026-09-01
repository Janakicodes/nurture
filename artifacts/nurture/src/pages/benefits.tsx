import { useState } from "react";
import {
  useListBenefits,
  useCheckEligibility,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, XCircle, ChevronRight, IndianRupee, FileText, ExternalLink, Award, ClipboardList } from "lucide-react";

const SCHEME_COLORS: Record<string, string> = {
  PMMVY: "bg-primary/10 text-primary",
  JSY: "bg-secondary/10 text-secondary",
  ESIC: "bg-purple-100 text-purple-700",
  MBA: "bg-orange-100 text-orange-700",
  ASHA: "bg-pink-100 text-pink-700",
};

const TARGET_LABELS: Record<string, string> = {
  all: "All women",
  bpl: "BPL families",
  government_employee: "Govt. employees",
  private_sector: "Private sector",
  unorganized_sector: "Unorganized sector",
};

type EligibilityForm = {
  employmentType: "government" | "private" | "self_employed" | "homemaker" | "other";
  isBPL: boolean;
  hasAadhar: boolean;
  hasBankAccount: boolean;
  isFirstTwoLivebirths: boolean;
  state: string;
};

const defaultForm: EligibilityForm = {
  employmentType: "homemaker",
  isBPL: false,
  hasAadhar: true,
  hasBankAccount: true,
  isFirstTwoLivebirths: true,
  state: "Maharashtra",
};

const STEPS = [
  { label: "Employment", field: "employmentType" },
  { label: "Status", field: "status" },
  { label: "Documents", field: "documents" },
];

export default function Benefits() {
  const { data: benefits = [] } = useListBenefits();
  const checkEligibility = useCheckEligibility();

  const [eligDialogOpen, setEligDialogOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EligibilityForm>(defaultForm);
  const [results, setResults] = useState<any[] | null>(null);

  const handleCheck = () => {
    checkEligibility.mutate(
      { data: form },
      { onSuccess: (data) => setResults(data) }
    );
  };

  const reset = () => {
    setStep(0);
    setForm(defaultForm);
    setResults(null);
    setEligDialogOpen(false);
  };

  const eligibleCount = results?.filter((r) => r.isEligible).length ?? 0;

  return (
    <div className="p-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-2xl font-bold text-foreground font-serif">Government Benefits</h1>
        <p className="text-muted-foreground text-sm mt-1">Indian maternity support schemes for you.</p>
      </header>

      {/* Eligibility CTA */}
      <Card className="border-none shadow-md bg-primary/10 border border-primary/20">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground">Check Your Eligibility</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Answer a few questions to find which schemes you qualify for.
            </p>
          </div>
          <Button size="sm" onClick={() => setEligDialogOpen(true)} className="shrink-0 gap-1">
            <ClipboardList className="h-4 w-4" /> Check
          </Button>
        </CardContent>
      </Card>

      {/* Benefits list */}
      <div className="space-y-4">
        {benefits.map((benefit) => (
          <Card key={benefit.id} className="border-none shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${SCHEME_COLORS[benefit.schemeCode] || "bg-muted text-muted-foreground"}`}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold leading-tight">{benefit.schemeName}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{benefit.schemeCode}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {TARGET_LABELS[benefit.targetGroup] || benefit.targetGroup}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              {benefit.benefitAmount && (
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <IndianRupee className="h-4 w-4" />
                  {benefit.benefitAmount}
                </div>
              )}

              <Accordion type="single" collapsible>
                <AccordionItem value="criteria" className="border-none">
                  <AccordionTrigger className="text-xs font-semibold text-foreground/80 py-2 hover:no-underline">
                    Eligibility Criteria
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-1.5">
                      {benefit.eligibilityCriteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-secondary mt-0.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="docs" className="border-none">
                  <AccordionTrigger className="text-xs font-semibold text-foreground/80 py-2 hover:no-underline">
                    Required Documents
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-1.5">
                      {benefit.requiredDocuments.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="steps" className="border-none">
                  <AccordionTrigger className="text-xs font-semibold text-foreground/80 py-2 hover:no-underline">
                    How to Apply
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="space-y-2">
                      {benefit.applicationSteps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="bg-primary/10 text-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ol>
                    {benefit.officialUrl && (
                      <a
                        href={benefit.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary mt-3 font-medium"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Official website
                      </a>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Eligibility Dialog */}
      <Dialog open={eligDialogOpen} onOpenChange={(o) => { if (!o) reset(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eligibility Check</DialogTitle>
          </DialogHeader>

          {!results ? (
            <div className="space-y-5">
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Step {step + 1} of {STEPS.length}</span>
                  <span>{STEPS[step].label}</span>
                </div>
                <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
              </div>

              {step === 0 && (
                <div className="space-y-3">
                  <div>
                    <Label>Employment type</Label>
                    <Select
                      value={form.employmentType}
                      onValueChange={(v) => setForm({ ...form, employmentType: v as EligibilityForm["employmentType"] })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="government">Government employee</SelectItem>
                        <SelectItem value="private">Private sector</SelectItem>
                        <SelectItem value="self_employed">Self-employed</SelectItem>
                        <SelectItem value="homemaker">Homemaker</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select
                      value={form.state}
                      onValueChange={(v) => setForm({ ...form, state: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Rajasthan", "Gujarat", "Other"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  {[
                    { key: "isBPL", label: "Below Poverty Line (BPL)", sub: "Do you have a BPL card?" },
                    { key: "isFirstTwoLivebirths", label: "First or second child", sub: "This is your 1st or 2nd live birth" },
                  ].map(({ key, label, sub }) => (
                    <div key={key} className="flex items-center justify-between border rounded-xl p-3">
                      <div>
                        <Label className="text-sm">{label}</Label>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                      <Switch
                        checked={form[key as keyof EligibilityForm] as boolean}
                        onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                      />
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {[
                    { key: "hasAadhar", label: "Aadhar card", sub: "You have a valid Aadhar card" },
                    { key: "hasBankAccount", label: "Bank account", sub: "You have an active bank account" },
                  ].map(({ key, label, sub }) => (
                    <div key={key} className="flex items-center justify-between border rounded-xl p-3">
                      <div>
                        <Label className="text-sm">{label}</Label>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                      <Switch
                        checked={form[key as keyof EligibilityForm] as boolean}
                        onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                      />
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter className="gap-2">
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>Back</Button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button size="sm" onClick={() => setStep(step + 1)} className="flex-1">
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleCheck} disabled={checkEligibility.isPending} className="flex-1">
                    {checkEligibility.isPending ? "Checking..." : "Check Eligibility"}
                  </Button>
                )}
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-3xl font-bold text-primary">{eligibleCount}</p>
                <p className="text-sm text-muted-foreground">schemes you may qualify for</p>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {results.map((r) => (
                  <div
                    key={r.benefitId}
                    className={`rounded-xl p-3 border ${r.isEligible ? "bg-green-50 border-green-200" : "bg-muted/40 border-border opacity-70"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {r.isEligible
                        ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className="text-sm font-semibold text-foreground">{r.schemeName}</span>
                    </div>
                    {r.reason && <p className="text-xs text-muted-foreground ml-6">{r.reason}</p>}
                    {r.isEligible && r.nextSteps?.length > 0 && (
                      <div className="ml-6 mt-2 space-y-1">
                        {r.nextSteps.map((s: string, i: number) => (
                          <p key={i} className="text-xs text-green-700">→ {s}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={reset}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
