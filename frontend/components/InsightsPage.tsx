"use client";

import { Paper, SimpleGrid, Table, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { getBreakdown, getSummary } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { BreakdownGroup, Summary } from "@/lib/types";

export function InsightsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [groups, setGroups] = useState<BreakdownGroup[]>([]);

  useEffect(() => {
    getSummary().then(setSummary);
    getBreakdown("country", {}).then(setGroups);
  }, []);

  return (
    <>
      <Title order={1} mb="md">
        Insights
      </Title>
      {summary && (
        <>
          <SimpleGrid cols={{ base: 2, md: 4 }} mb="xs">
            <Tile label="Employees" value={summary.headcount.toLocaleString("en-US")} />
            <Tile label="Total annual payroll" value={formatMoney(summary.total_payroll_usd, "USD")} />
            <Tile label="Median salary" value={formatMoney(summary.usd.median, "USD")} />
            <Tile label="Countries" value={String(summary.countries)} />
          </SimpleGrid>
          <Text size="sm" c="dimmed" mb="xl">
            Active employees only; {summary.inactive_count.toLocaleString("en-US")} people who have left are not counted.
            All USD figures use fixed reference exchange rates.
          </Text>
        </>
      )}
      <Title order={2} size="h3" mb="sm">
        Pay by country
      </Title>
      <BreakdownTable caption="Pay by country" label="Country" groups={groups} />
    </>
  );
}

function BreakdownTable({ caption, label, groups }: { caption: string; label: string; groups: BreakdownGroup[] }) {
  return (
    <Table.ScrollContainer minWidth={640}>
      <Table aria-label={caption}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{label}</Table.Th>
            <Table.Th ta="right">Employees</Table.Th>
            <Table.Th ta="right">Median (USD)</Table.Th>
            <Table.Th ta="right">Range (USD)</Table.Th>
            <Table.Th ta="right">Median (local)</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {groups.map((g) => (
            <Table.Tr key={g.key}>
              <Table.Td>{g.key}</Table.Td>
              <Table.Td ta="right">{g.headcount.toLocaleString("en-US")}</Table.Td>
              <Table.Td ta="right">{formatMoney(g.usd.median, "USD")}</Table.Td>
              <Table.Td ta="right">
                {formatMoney(g.usd.min, "USD")} – {formatMoney(g.usd.max, "USD")}
              </Table.Td>
              <Table.Td ta="right">{g.local ? formatMoney(g.local.median, g.local.currency) : "—"}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fw={700} fz={26}>
        {value}
      </Text>
    </Paper>
  );
}
