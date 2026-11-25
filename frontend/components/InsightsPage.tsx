"use client";

import { Group, NativeSelect, Paper, SegmentedControl, SimpleGrid, Table, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { getBreakdown, getFilterOptions, getSummary } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { BreakdownDimension, BreakdownGroup, FilterOptions, Summary } from "@/lib/types";

const DIMENSIONS: { value: BreakdownDimension; label: string }[] = [
  { value: "country", label: "Country" },
  { value: "department", label: "Department" },
  { value: "job_title", label: "Job title" },
  { value: "seniority", label: "Seniority" },
];
const SENIORITY_ORDER = ["junior", "mid", "senior", "lead", "executive"];

export function InsightsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [groups, setGroups] = useState<BreakdownGroup[]>([]);
  const [dimension, setDimension] = useState<BreakdownDimension>("country");
  const [country, setCountry] = useState("");
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const dimensionLabel = DIMENSIONS.find((d) => d.value === dimension)!.label;
  const drillCountry = dimension === "country" ? "" : country; // a country filter is meaningless when grouping by country

  useEffect(() => {
    getSummary().then(setSummary);
    getFilterOptions().then(setOptions).catch(() => setOptions(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getBreakdown(dimension, drillCountry ? { country: drillCountry } : {}).then((result) => {
      if (!cancelled) setGroups(dimension === "seniority" ? sortBySeniority(result) : result);
    });
    return () => {
      cancelled = true;
    };
  }, [dimension, drillCountry]);

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
      <Group justify="space-between" align="flex-end" mb="sm" wrap="wrap">
        <Title order={2} size="h3">
          Pay by {dimensionLabel.toLowerCase()}
        </Title>
        <Group align="flex-end">
          {dimension !== "country" && (
            <NativeSelect
              label="Within country"
              value={country}
              onChange={(e) => setCountry(e.currentTarget.value)}
              data={[{ value: "", label: "All countries" }, ...(options?.countries ?? []).map((c) => ({ value: c, label: c }))]}
            />
          )}
          <SegmentedControl
            aria-label="Group pay by"
            value={dimension}
            onChange={(v) => setDimension(v as BreakdownDimension)}
            data={DIMENSIONS}
          />
        </Group>
      </Group>
      <BreakdownTable caption={`Pay by ${dimensionLabel.toLowerCase()}`} label={dimensionLabel} groups={groups} />
    </>
  );
}

const sortBySeniority = (groups: BreakdownGroup[]) =>
  [...groups].sort((a, b) => SENIORITY_ORDER.indexOf(a.key) - SENIORITY_ORDER.indexOf(b.key));

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
