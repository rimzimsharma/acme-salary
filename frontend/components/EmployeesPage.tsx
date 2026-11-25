"use client";

import { Alert, Button, Group, NativeSelect, Table, Text, TextInput, Title } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { getFilterOptions, listEmployees } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Employee, EmployeeSearchParams, FilterOptions } from "@/lib/types";

type State = { status: "loading" | "ready" | "error"; employees: Employee[]; error?: string };

export function EmployeesPage() {
  const [state, setState] = useState<State>({ status: "loading", employees: [] });
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
  const [filters, setFilters] = useState({ country: "", department: "", seniority: "", status: "active" });
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const params: EmployeeSearchParams = { q: debouncedSearch, ...filters, status: filters.status as EmployeeSearchParams["status"] };
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    getFilterOptions().then(setOptions).catch(() => setOptions(null)); // filters stay usable without dropdown values
  }, []);

  useEffect(() => {
    let cancelled = false; // ignore responses that arrive after a newer request started
    setState((s) => ({ ...s, status: "loading", error: undefined }));
    listEmployees(JSON.parse(paramsKey))
      .then((result) => !cancelled && setState({ status: "ready", employees: result.data }))
      .catch((e: Error) => !cancelled && setState((s) => ({ ...s, status: "error", error: e.message })));
    return () => {
      cancelled = true;
    };
  }, [attempt, paramsKey]);

  const { status, employees, error } = state;

  return (
    <>
      <Title order={1} mb="md">
        Employees
      </Title>
      <Group align="flex-end" mb="md" wrap="wrap">
        <TextInput label="Search" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
        <FilterSelect label="Country" value={filters.country} values={options?.countries} onChange={(v) => setFilters({ ...filters, country: v })} />
        <FilterSelect label="Department" value={filters.department} values={options?.departments} onChange={(v) => setFilters({ ...filters, department: v })} />
        <FilterSelect label="Seniority" value={filters.seniority} values={options?.seniorities} onChange={(v) => setFilters({ ...filters, seniority: v })} />
        <NativeSelect
          label="Status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.currentTarget.value })}
          data={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "all", label: "All" }]}
        />
      </Group>
      {status === "error" && (
        <Alert color="red" title="Could not load employees" mb="md">
          <Text>{error}</Text>
          <Button mt="sm" variant="light" color="red" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        </Alert>
      )}
      {status === "loading" && employees.length === 0 && <Text>Loading employees…</Text>}
      {status === "ready" && employees.length === 0 && <Text>No employees match your filters.</Text>}
      {employees.length > 0 && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Job title</Table.Th>
              <Table.Th>Salary</Table.Th>
              <Table.Th>Salary (USD)</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {employees.map((e) => (
              <Table.Tr key={e.id}>
                <Table.Td>
                  {e.full_name}
                  <div>{e.email}</div>
                </Table.Td>
                <Table.Td>{e.job_title}</Table.Td>
                <Table.Td>{formatMoney(e.annual_salary, e.currency)}</Table.Td>
                <Table.Td>{formatMoney(e.annual_salary_usd, "USD")}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </>
  );
}

function FilterSelect({ label, value, values = [], onChange }: { label: string; value: string; values?: string[]; onChange: (v: string) => void }) {
  return (
    <NativeSelect
      label={label}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      data={[{ value: "", label: `All` }, ...values.map((v) => ({ value: v, label: v }))]}
    />
  );
}
