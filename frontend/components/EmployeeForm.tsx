"use client";

import { Alert, Button, Group, Modal, NativeSelect, NumberInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { ValidationError, createEmployee } from "@/lib/api";
import type { Employee, EmployeeInput, Seniority } from "@/lib/types";

const required = (value: unknown) => (value === "" || value === null || value === undefined ? "Required" : null);
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"];
const SENIORITIES: Seniority[] = ["junior", "mid", "senior", "lead", "executive"];

interface Props {
  opened: boolean;
  onClose: () => void;
  onSaved: (employee: Employee) => void;
}

export function EmployeeForm({ opened, onClose, onSaved }: Props) {
  const form = useForm({
    initialValues: {
      full_name: "", email: "", job_title: "", department: "", country: "", currency: "USD",
      annual_salary: "" as number | "", seniority: "mid", hire_date: "",
    },
    validate: {
      full_name: (v) => required(v.trim()),
      email: (v) => required(v.trim()) ?? (/^\S+@\S+\.\S+$/.test(v.trim()) ? null : "Enter a valid email address"),
      job_title: (v) => required(v.trim()),
      department: (v) => required(v.trim()),
      country: (v) => required(v.trim()),
      annual_salary: (v) => required(v) ?? (Number(v) > 0 ? null : "Must be greater than 0"),
      hire_date: (v) => required(v) ?? (v > new Date().toISOString().slice(0, 10) ? "Hire date cannot be in the future" : null),
    },
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = form.onSubmit(async (values) => {
    setFormError(null);
    setSaving(true);
    try {
      const saved = await createEmployee({ ...values, annual_salary: Number(values.annual_salary) } as EmployeeInput);
      onSaved(saved);
    } catch (error) {
      if (error instanceof ValidationError) {
        // Show each server message next to its field; keep everything the user typed.
        form.setErrors(Object.fromEntries(Object.entries(error.errors).map(([field, messages]) => [field, messages.join(", ")])));
      } else {
        setFormError(error instanceof Error ? error.message : "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Add employee" transitionProps={{ duration: 0 }}>
      <form onSubmit={submit}>
        <Stack>
          {formError && <Alert color="red">{formError}</Alert>}
          <TextInput label="Full name" {...form.getInputProps("full_name")} />
          <TextInput label="Email" {...form.getInputProps("email")} />
          <TextInput label="Job title" {...form.getInputProps("job_title")} />
          <TextInput label="Department" {...form.getInputProps("department")} />
          <TextInput label="Country" {...form.getInputProps("country")} />
          <NativeSelect label="Currency" data={CURRENCIES} {...form.getInputProps("currency")} />
          <NumberInput label="Annual salary" min={1} allowDecimal={false} thousandSeparator="" {...form.getInputProps("annual_salary")} />
          <NativeSelect label="Seniority" data={SENIORITIES} {...form.getInputProps("seniority")} />
          <TextInput label="Hire date" type="date" {...form.getInputProps("hire_date")} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
