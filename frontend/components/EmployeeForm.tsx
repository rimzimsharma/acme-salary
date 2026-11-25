"use client";

import { Button, Group, Modal, NativeSelect, NumberInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { createEmployee } from "@/lib/api";
import type { Employee, EmployeeInput, Seniority } from "@/lib/types";

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
  });

  const submit = form.onSubmit(async (values) => {
    const saved = await createEmployee({ ...values, annual_salary: Number(values.annual_salary) } as EmployeeInput);
    onSaved(saved);
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Add employee" transitionProps={{ duration: 0 }}>
      <form onSubmit={submit}>
        <Stack>
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
            <Button type="submit">Save</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
