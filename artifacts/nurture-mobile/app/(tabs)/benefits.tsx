import { useCheckEligibility, useListBenefits } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { trackAnonymousEvent } from "@/lib/analytics";

const SCHEME_COLORS: Record<string, string> = {
  PMMVY: "#E76E50",
  JSY: "#80B19A",
  ESIC: "#8B5CF6",
  MBA: "#F59E0B",
  ASHA: "#EC4899",
};

const TARGET_LABELS: Record<string, string> = {
  all: "All women",
  bpl: "BPL families",
  government_employee: "Govt. employees",
  private_sector: "Private sector",
  unorganized_sector: "Unorganized sector",
};

function schemeColor(code: string): string {
  const key = Object.keys(SCHEME_COLORS).find((k) => code?.toUpperCase().includes(k));
  return key ? SCHEME_COLORS[key] : "#6B7280";
}

const STEPS = [
  { label: "Employment", index: 0 },
  { label: "Status", index: 1 },
  { label: "Documents", index: 2 },
];

type EligibilityForm = {
  employmentType: "government" | "private" | "self_employed" | "homemaker" | "other";
  state: string;
  isBPL: boolean;
  isFirstTwoLivebirths: boolean;
  hasAadhar: boolean;
  hasBankAccount: boolean;
};

const defaultForm: EligibilityForm = {
  employmentType: "homemaker",
  state: "Maharashtra",
  isBPL: false,
  isFirstTwoLivebirths: true,
  hasAadhar: true,
  hasBankAccount: true,
};

const EMPLOYMENT_OPTIONS: { value: EligibilityForm["employmentType"]; label: string }[] = [
  { value: "government", label: "Government employee" },
  { value: "private", label: "Private sector" },
  { value: "self_employed", label: "Self-employed" },
  { value: "homemaker", label: "Homemaker" },
  { value: "other", label: "Other" },
];

const STATE_OPTIONS = [
  "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu",
  "Uttar Pradesh", "West Bengal", "Rajasthan", "Gujarat", "Other",
];

export default function BenefitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: benefits, isLoading, refetch, isRefetching } = useListBenefits();
  const checkEligibility = useCheckEligibility();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [checkerVisible, setCheckerVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EligibilityForm>(defaultForm);
  const [results, setResults] = useState<any[] | null>(null);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 80);
  const s = styles(colors);

  const openChecker = () => {
    void trackAnonymousEvent("eligibility_check_started");
    setStep(0);
    setForm(defaultForm);
    setResults(null);
    setCheckerVisible(true);
  };

  React.useEffect(() => {
    void trackAnonymousEvent("benefits_viewed");
  }, []);

  const handleCheck = async () => {
    const res = await checkEligibility.mutateAsync({ data: form });
    setResults(res as any[]);
  };

  const reset = () => {
    setCheckerVisible(false);
    setStep(0);
    setForm(defaultForm);
    setResults(null);
  };

  const eligibleCount = (results ?? []).filter((r) => r.isEligible).length;
  const benefitList = (benefits as any[]) ?? [];

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Government Benefits</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Indian maternity support schemes.</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Eligibility CTA */}
        <View style={[s.ctaCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.ctaTitle, { color: colors.foreground }]}>Check Your Eligibility</Text>
            <Text style={[s.ctaSub, { color: colors.mutedForeground }]}>
              Answer a few questions to find which schemes you qualify for.
            </Text>
          </View>
          <Pressable style={[s.ctaBtn, { backgroundColor: colors.primary }]} onPress={openChecker}>
            <Feather name="clipboard" size={14} color="#fff" />
            <Text style={s.ctaBtnText}>Check</Text>
          </Pressable>
        </View>

        {/* Disclaimer */}
        <View style={[s.disclaimer, { backgroundColor: colors.warning + "12", borderColor: colors.warning + "35" }]}>
          <Feather name="info" size={14} color={colors.warning} style={{ marginTop: 1 }} />
          <Text style={[s.disclaimerText, { color: colors.mutedForeground }]}>
            Benefits, eligibility, and amounts may vary by state and may change based on government updates.
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          benefitList.map((b: any) => {
            const color = schemeColor(b.schemeCode ?? "");
            const expanded = expandedId === b.id;
            const criteria: string[] = Array.isArray(b.eligibilityCriteria) ? b.eligibilityCriteria : [];
            const documents: string[] = Array.isArray(b.requiredDocuments) ? b.requiredDocuments : [];
            const steps: string[] = Array.isArray(b.applicationSteps) ? b.applicationSteps : [];

            return (
              <View key={b.id} style={[s.benefitCard, { borderColor: colors.border }]}>
                <Pressable style={s.benefitTop} onPress={() => setExpandedId(expanded ? null : b.id)}>
                  <View style={[s.benefitIcon, { backgroundColor: color + "15" }]}>
                    <Feather name="award" size={20} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Text style={[s.benefitName, { color: colors.foreground }]}>{b.schemeName}</Text>
                      {b.schemeCode ? (
                        <Text style={[s.schemeCode, { color: colors.mutedForeground }]}>{b.schemeCode}</Text>
                      ) : null}
                    </View>
                    {b.targetGroup ? (
                      <View style={[s.targetBadge, { backgroundColor: colors.muted }]}>
                        <Text style={[s.targetBadgeText, { color: colors.mutedForeground }]}>
                          {TARGET_LABELS[b.targetGroup] ?? b.targetGroup}
                        </Text>
                      </View>
                    ) : null}
                    {b.benefitAmount ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <Text style={{ fontSize: 13, color }}>₹</Text>
                        <Text style={[s.benefitAmount, { color }]}>{b.benefitAmount}</Text>
                      </View>
                    ) : null}
                    <Text style={[s.benefitDesc, { color: colors.mutedForeground }]} numberOfLines={expanded ? undefined : 2}>
                      {b.description}
                    </Text>
                  </View>
                  <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                </Pressable>

                {expanded && (
                  <View style={[s.benefitExpanded, { borderTopColor: colors.border }]}>
                    {/* Eligibility criteria */}
                    {criteria.length > 0 && (
                      <CollapsibleSection title="Eligibility Criteria" defaultOpen colors={colors} s={s}>
                        {criteria.map((c, i) => (
                          <View key={i} style={s.bulletRow}>
                            <Feather name="check-circle" size={13} color={colors.secondary} />
                            <Text style={[s.bulletText, { color: colors.mutedForeground }]}>{c}</Text>
                          </View>
                        ))}
                      </CollapsibleSection>
                    )}

                    {/* Required documents */}
                    {documents.length > 0 && (
                      <CollapsibleSection title="Required Documents" colors={colors} s={s}>
                        {documents.map((d, i) => (
                          <View key={i} style={s.bulletRow}>
                            <Feather name="file-text" size={13} color={colors.primary} />
                            <Text style={[s.bulletText, { color: colors.mutedForeground }]}>{d}</Text>
                          </View>
                        ))}
                      </CollapsibleSection>
                    )}

                    {/* How to apply */}
                    {steps.length > 0 && (
                      <CollapsibleSection title="How to Apply" colors={colors} s={s}>
                        {steps.map((step, i) => (
                          <View key={i} style={s.bulletRow}>
                            <View style={[s.stepNum, { backgroundColor: color + "20" }]}>
                              <Text style={[s.stepNumText, { color }]}>{i + 1}</Text>
                            </View>
                            <Text style={[s.bulletText, { color: colors.mutedForeground }]}>{step}</Text>
                          </View>
                        ))}
                        {b.officialUrl ? (
                          <Pressable style={s.officialLink} onPress={() => Linking.openURL(b.officialUrl)}>
                            <Feather name="external-link" size={13} color={colors.primary} />
                            <Text style={[s.officialLinkText, { color: colors.primary }]}>Official website</Text>
                          </Pressable>
                        ) : null}
                      </CollapsibleSection>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Eligibility Checker Modal ── */}
      <Modal visible={checkerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={reset}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.modalHeader, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
            <Pressable onPress={reset}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Eligibility Check</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
            {!results ? (
              <>
                {/* Step progress */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={[s.stepIndicator, { color: colors.mutedForeground }]}>Step {step + 1} of {STEPS.length}</Text>
                    <Text style={[s.stepIndicator, { color: colors.mutedForeground }]}>{STEPS[step].label}</Text>
                  </View>
                  <View style={[s.progressBar, { backgroundColor: colors.muted }]}>
                    <View style={[s.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: colors.primary }]} />
                  </View>
                </View>

                {step === 0 && (
                  <View style={{ gap: 14 }}>
                    <View style={{ gap: 6 }}>
                      <Text style={[s.fieldLabel, { color: colors.foreground }]}>Employment type</Text>
                      {EMPLOYMENT_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.value}
                          style={[s.radioRow, {
                            borderColor: form.employmentType === opt.value ? colors.primary : colors.border,
                            backgroundColor: form.employmentType === opt.value ? colors.primary + "08" : colors.card,
                          }]}
                          onPress={() => setForm({ ...form, employmentType: opt.value })}
                        >
                          <View style={[s.radio, {
                            borderColor: form.employmentType === opt.value ? colors.primary : colors.border,
                            backgroundColor: form.employmentType === opt.value ? colors.primary : "transparent",
                          }]}>
                            {form.employmentType === opt.value ? <View style={s.radioInner} /> : null}
                          </View>
                          <Text style={[s.radioLabel, { color: colors.foreground }]}>{opt.label}</Text>
                        </Pressable>
                      ))}
                    </View>

                    <View style={{ gap: 6 }}>
                      <Text style={[s.fieldLabel, { color: colors.foreground }]}>State</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {STATE_OPTIONS.map((st) => (
                          <Pressable
                            key={st}
                            style={[s.stateChip, {
                              borderColor: form.state === st ? colors.primary : colors.border,
                              backgroundColor: form.state === st ? colors.primary + "10" : colors.card,
                            }]}
                            onPress={() => setForm({ ...form, state: st })}
                          >
                            <Text style={[s.stateChipText, { color: form.state === st ? colors.primary : colors.foreground }]}>{st}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                )}

                {step === 1 && (
                  <View style={{ gap: 12 }}>
                    {([
                      { key: "isBPL", label: "Below Poverty Line (BPL)", sub: "Do you have a BPL card?" },
                      { key: "isFirstTwoLivebirths", label: "First or second child", sub: "This is your 1st or 2nd live birth" },
                    ] as { key: keyof EligibilityForm; label: string; sub: string }[]).map(({ key, label, sub }) => (
                      <View key={key} style={[s.switchRow, { borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.switchLabel, { color: colors.foreground }]}>{label}</Text>
                          <Text style={[s.switchSub, { color: colors.mutedForeground }]}>{sub}</Text>
                        </View>
                        <Switch
                          value={form[key] as boolean}
                          onValueChange={(v) => setForm({ ...form, [key]: v })}
                          trackColor={{ false: colors.border, true: colors.primary + "80" }}
                          thumbColor={form[key] ? colors.primary : colors.mutedForeground}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {step === 2 && (
                  <View style={{ gap: 12 }}>
                    {([
                      { key: "hasAadhar", label: "Aadhar card", sub: "You have a valid Aadhar card" },
                      { key: "hasBankAccount", label: "Bank account", sub: "You have an active bank account" },
                    ] as { key: keyof EligibilityForm; label: string; sub: string }[]).map(({ key, label, sub }) => (
                      <View key={key} style={[s.switchRow, { borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.switchLabel, { color: colors.foreground }]}>{label}</Text>
                          <Text style={[s.switchSub, { color: colors.mutedForeground }]}>{sub}</Text>
                        </View>
                        <Switch
                          value={form[key] as boolean}
                          onValueChange={(v) => setForm({ ...form, [key]: v })}
                          trackColor={{ false: colors.border, true: colors.primary + "80" }}
                          thumbColor={form[key] ? colors.primary : colors.mutedForeground}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {/* Navigation */}
                <View style={s.stepNav}>
                  {step > 0 && (
                    <Pressable style={[s.stepBtn, { borderColor: colors.border, flex: 1 }]} onPress={() => setStep(step - 1)}>
                      <Text style={[s.stepBtnText, { color: colors.foreground }]}>Back</Text>
                    </Pressable>
                  )}
                  {step < STEPS.length - 1 ? (
                    <Pressable style={[s.stepBtnPrimary, { backgroundColor: colors.primary, flex: 2 }]} onPress={() => setStep(step + 1)}>
                      <Text style={s.stepBtnPrimaryText}>Next</Text>
                      <Feather name="chevron-right" size={16} color="#fff" />
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[s.stepBtnPrimary, { backgroundColor: colors.primary, flex: 2, opacity: checkEligibility.isPending ? 0.75 : 1 }]}
                      onPress={handleCheck}
                      disabled={checkEligibility.isPending}
                    >
                      {checkEligibility.isPending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={s.stepBtnPrimaryText}>Check Eligibility</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </>
            ) : (
              <>
                {/* Results */}
                <View style={s.resultsHeader}>
                  <Text style={[s.resultsCount, { color: colors.primary }]}>{eligibleCount}</Text>
                  <Text style={[s.resultsSub, { color: colors.mutedForeground }]}>schemes you may qualify for</Text>
                </View>

                {(results as any[]).map((r: any, i: number) => (
                  <View
                    key={i}
                    style={[
                      s.resultCard,
                      {
                        backgroundColor: r.isEligible ? colors.secondary + "10" : colors.muted,
                        borderColor: r.isEligible ? colors.secondary + "40" : colors.border,
                        opacity: r.isEligible ? 1 : 0.65,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Feather
                        name={r.isEligible ? "check-circle" : "x-circle"}
                        size={18}
                        color={r.isEligible ? colors.secondary : colors.mutedForeground}
                      />
                      <Text style={[s.resultName, { color: r.isEligible ? colors.foreground : colors.mutedForeground }]}>
                        {r.schemeName}
                      </Text>
                    </View>
                    {r.reason ? <Text style={[s.resultReason, { color: colors.mutedForeground }]}>{r.reason}</Text> : null}
                    {r.isEligible && r.nextSteps?.length > 0 && (
                      <View style={{ gap: 2, marginTop: 4 }}>
                        {r.nextSteps.map((ns: string, j: number) => (
                          <Text key={j} style={[s.nextStep, { color: colors.secondary }]}>→ {ns}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                <Pressable style={[s.stepBtnPrimary, { backgroundColor: colors.primary }]} onPress={reset}>
                  <Text style={s.stepBtnPrimaryText}>Done</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function CollapsibleSection({ title, children, colors, s, defaultOpen }: {
  title: string; children: React.ReactNode; colors: ReturnType<typeof useColors>; s: any; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <View style={[s.collapsible, { borderColor: colors.border }]}>
      <Pressable style={s.collapsibleHeader} onPress={() => setOpen(!open)}>
        <Text style={[s.collapsibleTitle, { color: colors.foreground }]}>{title}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={15} color={colors.mutedForeground} />
      </Pressable>
      {open && <View style={{ paddingTop: 8, gap: 8 }}>{children}</View>}
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: 20, paddingBottom: 12 },
    headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: c.foreground },
    headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
    disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
    disclaimerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
    ctaCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
    ctaTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    ctaSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 18 },
    ctaBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    ctaBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
    benefitCard: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
    benefitTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
    benefitIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    benefitName: { fontSize: 15, fontFamily: "Inter_700Bold" },
    schemeCode: { fontSize: 12, fontFamily: "Inter_400Regular" },
    targetBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
    targetBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
    benefitAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
    benefitDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 4 },
    benefitExpanded: { borderTopWidth: 1, padding: 14, gap: 10 },
    collapsible: { borderWidth: 1, borderRadius: 10, padding: 12 },
    collapsibleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    collapsibleTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    bulletText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    stepNum: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    stepNumText: { fontSize: 11, fontFamily: "Inter_700Bold" },
    officialLink: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
    officialLinkText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    stepIndicator: { fontSize: 12, fontFamily: "Inter_400Regular" },
    progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 3 },
    fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
    radioRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1.5 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
    radioLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
    stateChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
    stateChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    switchRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
    switchLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
    switchSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    stepNav: { flexDirection: "row", gap: 10 },
    stepBtn: { paddingVertical: 13, borderRadius: 14, borderWidth: 1, alignItems: "center" },
    stepBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
    stepBtnPrimary: { paddingVertical: 13, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
    stepBtnPrimaryText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
    resultsHeader: { alignItems: "center", paddingVertical: 8 },
    resultsCount: { fontSize: 48, fontFamily: "Inter_700Bold" },
    resultsSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
    resultCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
    resultName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
    resultReason: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginLeft: 26 },
    nextStep: { fontSize: 12, fontFamily: "Inter_500Medium", marginLeft: 26 },
  });
