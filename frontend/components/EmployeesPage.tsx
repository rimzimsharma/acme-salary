"use client";

import { Alert, Badge, Button, Group, NativeSelect, Pagination, Table, Text, TextInput, Title, UnstyledButton } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { getFilterOptions, listEmployees } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Employee, EmployeeSearchParams, FilterOptions, PageMeta } from "@/lib/types";
import { EmployeeForm } from "./EmployeeForm";

type State = { status: "loading" | "ready" | "error"; employees: Employee[]; meta?: PageMeta; error?: string };

export function EmployeesPage() {
  const [state, setState] = useState<State>({ status: "loading", employees: [] });
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
  const [filters, setFilters] = useState({ country: "", department: "", seniority: "", status: "active" });
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ column: string; dir: "asc" | "desc" } | null>(null);
  const params: EmployeeSearchParams = { q: debouncedSearch, ...filters, page, sort: sort?.column, dir: sort?.dir, status: filters.status as EmployeeSearchParams["status"] };
  const paramsKey = JSON.stringify(params);

  useEffect(() => setPage(1), [debouncedSearch]);

  const changeFilter = (change: Partial<typeof filters>) => {
    setFilters({ ...filters, ...change });
    setPage(1);
  };

  useEffect(() => {
    getFilterOptions().then(setOptions).catch(() => setOptions(null)); // filters stay usable without dropdown values
  }, []);

  useEffect(() => {
    let cancelled = false; // ignore responses that arrive after a newer request started
    setState((s) => ({ ...s, status: "loading", error: undefined }));
    listEmployees(JSON.parse(paramsKey))
      .then((result) => !cancelled && setState({ status: "ready", employees: result.data, meta: result.meta }))
      .catch((e: Error) => !cancelled && setState((s) => ({ ...s, status: "error", error: e.message })));
    return () => {
      cancelled = true;
    };
  }, [attempt, paramsKey]);

  const { status, employees, error, meta } = state;

  const handleSaved = () => {
    setFormOpen(false);
    setAttempt((n) => n + 1); // refetch so the list reflects the change
    notifications.show({ message: "Employee saved", color: "green" });
  };

  const toggleSort = (column: string) => {
    setSort((current) => ({ column, dir: current?.column === column && current.dir === "asc" ? "desc" : "asc" }));
    setPage(1);
  };
  const header = (label: string, column: string, enabled = true) => (
    <SortableTh label={label} active={sort?.column === column ? sort.dir : null} enabled={enabled} onSort={() => toggleSort(column)} />
  );

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={1}>Employees</Title>
        <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>Add employee</Button>
      </Group>
      <EmployeeForm opened={formOpen} employee={editing} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      <Group align="flex-end" mb="md" wrap="wrap">
        <TextInput label="Search" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
        <FilterSelect label="Country" value={filters.country} values={options?.countries} onChange={(country) => changeFilter({ country })} />
        <FilterSelect label="Department" value={filters.department} values={options?.departments} onChange={(department) => changeFilter({ department })} />
        <FilterSelect label="Seniority" value={filters.seniority} values={options?.seniorities} onChange={(seniority) => changeFilter({ seniority })} />
        <NativeSelect
          label="Status"
          value={filters.status}
          onChange={(e) => changeFilter({ status: e.currentTarget.value })}
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
              {header("Name", "full_name")}
              {header("Job title", "job_title")}
              {header("Department", "department")}
              {header("Country", "country")}
              <Table.Th>Seniority</Table.Th>
              {header("Salary", "annual_salary", filters.country !== "")}
              <Table.Th>Salary (USD)</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>
                <span style={{ position: "absolute", left: -9999 }}>Actions</span>
              </Table.Th>
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
                <Table.Td>{e.department}</Table.Td>
                <Table.Td>{e.country}</Table.Td>
                <Table.Td>{e.seniority}</Table.Td>
                <Table.Td>{formatMoney(e.annual_salary, e.currency)}</Table.Td>
                <Table.Td>{formatMoney(e.annual_salary_usd, "USD")}</Table.Td>
                <Table.Td>{e.active ? "Active" : <Badge color="gray">Inactive</Badge>}</Table.Td>
                <Table.Td>
                  <Button
                    size="compact-sm"
                    variant="subtle"
                    aria-label={`Edit ${e.full_name}`}
                    onClick={() => { setEditing(e); setFormOpen(true); }}
                  >
                    Edit
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
      {meta && meta.total > 0 && (
        <Group justify="space-between" mt="md">
          <Text size="sm" c="dimmed">
            {meta.total.toLocaleString("en-US")} {meta.total === 1 ? "employee" : "employees"}
          </Text>
          {meta.total_pages > 1 && <Pagination total={meta.total_pages} value={page} onChange={setPage} />}
        </Group>
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

function SortableTh({ label, active, enabled, onSort }: { label: string; active: "asc" | "desc" | null; enabled: boolean; onSort: () => void }) {
  if (!enabled) {
    return <Table.Th title="Select a country to sort by salary (currencies differ)">{label}</Table.Th>;
  }
  const ariaSort = active === "asc" ? "ascending" : active === "desc" ? "descending" : "none";
  return (
    <Table.Th aria-sort={ariaSort}>
      <UnstyledButton onClick={onSort} fw={600} fz="sm">
        {label}
        {active && <span aria-hidden> {active === "asc" ? "▲" : "▼"}</span>}
      </UnstyledButton>
    </Table.Th>
  );
}
