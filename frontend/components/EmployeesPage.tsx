"use client";

import { Table, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { listEmployees } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Employee } from "@/lib/types";

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    listEmployees().then((result) => setEmployees(result.data));
  }, []);

  return (
    <>
      <Title order={1} mb="md">
        Employees
      </Title>
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
    </>
  );
}
