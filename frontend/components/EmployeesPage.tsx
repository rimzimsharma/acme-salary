"use client";

import { Alert, Button, Table, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { listEmployees } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Employee } from "@/lib/types";

type State = { status: "loading" | "ready" | "error"; employees: Employee[]; error?: string };

export function EmployeesPage() {
  const [state, setState] = useState<State>({ status: "loading", employees: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false; // ignore responses that arrive after a newer request started
    setState((s) => ({ ...s, status: "loading", error: undefined }));
    listEmployees()
      .then((result) => !cancelled && setState({ status: "ready", employees: result.data }))
      .catch((e: Error) => !cancelled && setState((s) => ({ ...s, status: "error", error: e.message })));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const { status, employees, error } = state;

  return (
    <>
      <Title order={1} mb="md">
        Employees
      </Title>
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
