"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import { createDesign } from "@/lib/design/api";
import { designFormSchema, metresToMillimetres, type DesignFormValues } from "@/lib/design/form";
import { designKeys } from "@/lib/design/query";
import type { RoomTemplate } from "@/lib/design/types";

const inputClass = "mt-2 h-12 w-full rounded-xl border border-ink/15 bg-canvas px-4 text-base outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20";

export function CreateDesignForm({ templates }: { templates: RoomTemplate[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [requestId, setRequestId] = useState<string>();
  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: { name: "", mode: "template", template: templates[0]?.slug ?? "", widthM: "4", depthM: "5", heightM: "2.7", floor: "oak", wallColor: "#F2EFE9" },
  });
  const mode = useWatch({ control: form.control, name: "mode" });
  const selectedTemplate = useWatch({ control: form.control, name: "template" });
  const mutation = useMutation({
    mutationFn: createDesign,
    onSuccess: async (design) => {
      queryClient.setQueryData(designKeys.detail(design.id), design);
      await queryClient.invalidateQueries({ queryKey: designKeys.list });
      router.push(`/designs/${design.id}`);
      router.refresh();
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setRequestId(undefined);
    mutation.reset();
    const input = values.mode === "template"
      ? { name: values.name, template: values.template }
      : { name: values.name, width_mm: metresToMillimetres(values.widthM), depth_mm: metresToMillimetres(values.depthM), height_mm: metresToMillimetres(values.heightM), features: { floor: values.floor, wall_color: values.wallColor, openings: [] } };
    try {
      await mutation.mutateAsync(input);
    } catch (error) {
      if (error instanceof ApiError) {
        setRequestId(error.requestId);
        const fields: Record<string, keyof DesignFormValues> = { name: "name", template: "template", width_mm: "widthM", depth_mm: "depthM", height_mm: "heightM", "features.floor": "floor", "features.wall_color": "wallColor" };
        for (const [key, message] of Object.entries(error.details ?? {})) {
          const field = fields[key];
          if (field) form.setError(field, { type: "server", message });
        }
      }
    }
  });

  const field = (name: keyof DesignFormValues, label: string, type = "text") => (
    <label className="block text-sm font-medium">{label}<input type={type} {...form.register(name)} aria-invalid={Boolean(form.formState.errors[name])} className={inputClass} />{form.formState.errors[name]?.message && <span className="mt-2 block text-sm text-terracotta">{form.formState.errors[name]?.message}</span>}</label>
  );

  return (
    <form noValidate onSubmit={submit} className="space-y-8">
      {field("name", "Design name")}
      <fieldset><legend className="text-sm font-medium">Room source</legend><div className="mt-3 flex gap-3">{(["template", "custom"] as const).map((value) => <button key={value} type="button" role="radio" aria-checked={mode === value} onClick={() => form.setValue("mode", value, { shouldValidate: true })} className={`rounded-full border px-5 py-2 text-sm ${mode === value ? "border-terracotta bg-terracotta/10" : "border-ink/15"}`}>{value === "template" ? "Room template" : "Custom room"}</button>)}</div></fieldset>
      {mode === "template" ? (
        <fieldset><legend className="text-sm font-medium">Choose a template</legend><div className="mt-3 grid gap-4 md:grid-cols-3">{templates.map((template) => { const selected = selectedTemplate === template.slug; return <button key={template.id} type="button" onClick={() => form.setValue("template", template.slug, { shouldValidate: true })} className={`rounded-2xl border p-5 text-left ${selected ? "border-terracotta bg-terracotta/5 ring-1 ring-terracotta" : "border-ink/10"}`} aria-pressed={selected}><span className="font-serif text-xl">{template.name}</span><span className="mt-2 block text-xs leading-5 text-ink/60">{template.description}</span><span className="mt-4 block text-xs">{template.room.widthMm / 1000} × {template.room.depthMm / 1000} × {template.room.heightMm / 1000} m · {template.features.floor ?? "Floor unspecified"} · {template.features.openings.length} openings</span></button>; })}</div>{form.formState.errors.template?.message && <p className="mt-2 text-sm text-terracotta">{form.formState.errors.template.message}</p>}</fieldset>
      ) : (
        <div className="grid gap-5 rounded-2xl border border-ink/10 bg-canvas-deep/20 p-6 sm:grid-cols-2">
          {field("widthM", "Width (metres)", "text")}{field("depthM", "Depth (metres)", "text")}{field("heightM", "Height (metres)", "text")}
          <label className="text-sm font-medium">Floor<select {...form.register("floor")} className={inputClass}><option value="oak">Oak</option><option value="tile">Tile</option><option value="carpet">Carpet</option><option value="concrete">Concrete</option></select></label>
          <label className="text-sm font-medium sm:col-span-2">Wall colour<div className="mt-2 flex gap-3"><input type="color" {...form.register("wallColor")} className="h-12 w-16 rounded-xl border border-ink/15 bg-canvas p-1" /><input {...form.register("wallColor")} className="h-12 flex-1 rounded-xl border border-ink/15 bg-canvas px-4 font-mono uppercase" /></div>{form.formState.errors.wallColor?.message && <span className="mt-2 block text-sm text-terracotta">{form.formState.errors.wallColor.message}</span>}</label>
        </div>
      )}
      {mutation.isError && <div role="alert" className="rounded-xl bg-terracotta/10 p-4 text-sm text-terracotta"><p>{mutation.error instanceof ApiError && mutation.error.code === "validation_failed" ? "Check the highlighted room details." : "The design could not be created. Try again."}</p>{requestId && <p className="mt-1 font-mono text-xs">Request ID: {requestId}</p>}</div>}
      <Button type="submit" size="lg" disabled={mutation.isPending}>{mutation.isPending ? "Creating room…" : "Create design"}</Button>
    </form>
  );
}
