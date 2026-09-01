import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Baby, CalendarHeart, UserRound, Bell, ChevronRight, ChevronLeft } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  useLmp: z.boolean(),
  dueDate: z.string().optional(),
  lmpDate: z.string().optional(),
  isFirstPregnancy: z.boolean(),
  notificationsEnabled: z.boolean(),
}).refine(
  (d) => d.useLmp ? !!d.lmpDate : !!d.dueDate,
  { message: "Please enter a date", path: ["dueDate"] }
);

type FormValues = z.infer<typeof formSchema>;

const STEPS = [
  { label: "About You", icon: UserRound },
  { label: "Your Pregnancy", icon: CalendarHeart },
  { label: "Preferences", icon: Bell },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const createProfile = useCreateProfile();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      useLmp: false,
      dueDate: "",
      lmpDate: "",
      isFirstPregnancy: true,
      notificationsEnabled: true,
    },
  });

  const useLmp = form.watch("useLmp");

  const computeDueDateFromLmp = (lmp: string): string => {
    const d = new Date(lmp);
    d.setDate(d.getDate() + 280);
    return d.toISOString().split("T")[0];
  };

  const onSubmit = (values: FormValues) => {
    const dueDate = values.useLmp && values.lmpDate
      ? computeDueDateFromLmp(values.lmpDate)
      : values.dueDate!;

    createProfile.mutate(
      { data: { name: values.name, dueDate, isFirstPregnancy: values.isFirstPregnancy, notificationsEnabled: values.notificationsEnabled } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetProfileQueryKey(), data);
          setLocation("/");
        },
      }
    );
  };

  const nextStep = async () => {
    let valid = false;
    if (step === 0) valid = await form.trigger("name");
    else if (step === 1) {
      valid = await form.trigger(useLmp ? "lmpDate" : "dueDate");
    } else {
      valid = true;
    }
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="px-6 pt-14 pb-6 bg-primary/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2.5 rounded-2xl">
            <Baby className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-serif">Welcome to Nurture</h1>
            <p className="text-muted-foreground text-sm">Your pregnancy companion</p>
          </div>
        </div>

        {/* Step progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{STEPS[step].label}</span>
            <span>Step {step + 1} of {STEPS.length}</span>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
          <div className="flex gap-2 pt-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    i === step ? "text-primary" : i < step ? "text-secondary" : "text-muted-foreground/40"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                  {i < STEPS.length - 1 && <span className="ml-1 text-border">·</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Step 1: About You */}
            {step === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">What's your name?</h2>
                  <p className="text-sm text-muted-foreground mb-4">We'll personalise your experience.</p>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Priya" {...field} className="bg-white text-base" autoFocus />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted/40 rounded-2xl p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">🔒 Privacy first</p>
                  <p>Nurture works without creating an account. Your data stays on this device.</p>
                </div>
              </div>
            )}

            {/* Step 2: Pregnancy Details */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Your pregnancy dates</h2>
                  <p className="text-sm text-muted-foreground mb-4">We'll calculate your current week automatically.</p>
                </div>

                {/* LMP / Due Date toggle */}
                <FormField
                  control={form.control}
                  name="useLmp"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border p-4 bg-white">
                      <div>
                        <FormLabel className="text-sm font-medium">I know my LMP date</FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">Last Menstrual Period date</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {useLmp ? (
                  <FormField
                    control={form.control}
                    name="lmpDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Menstrual Period (LMP)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">Due date will be calculated as LMP + 280 days.</p>
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">A few preferences</h2>
                  <p className="text-sm text-muted-foreground mb-4">Helps us personalise your guidance.</p>
                </div>

                <FormField
                  control={form.control}
                  name="isFirstPregnancy"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border p-4 bg-white">
                      <div>
                        <FormLabel className="text-base">First Pregnancy</FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">Is this your first time expecting?</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border p-4 bg-white">
                      <div>
                        <FormLabel className="text-base">Weekly Updates</FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">Receive weekly pregnancy reminders</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                  <p className="text-sm font-medium text-primary mb-1">You're all set! 🌸</p>
                  <p className="text-xs text-muted-foreground">Tap "Start my journey" to begin. You can update these details any time from your profile.</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-none"
                  onClick={() => setStep((s) => s - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {isLast ? (
                <Button type="submit" size="lg" className="flex-1" disabled={createProfile.isPending}>
                  {createProfile.isPending ? "Saving..." : "Start my journey 🌸"}
                </Button>
              ) : (
                <Button type="button" size="lg" className="flex-1" onClick={nextStep}>
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
