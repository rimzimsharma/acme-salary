"use client";

import { Alert, Badge, Box, Button, Group, NativeSelect, Paper, SegmentedControl, SimpleGrid, Table, Text, Title } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import { useEffect, useState } from "react";
import { getBreakdown, getFilterOptions, getOutliers, getSummary } from "@/lib/api";
import { formatDeviation, formatMoney } from "@/lib/format";
import type { BreakdownDimension, BreakdownGroup, FilterOptions, Outlier, Summary } from "@/lib/types";

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
  const [outliers, setOutliers] = useState<Outlier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const fail = (e: Error) => setError(e.message);
  const dimensionLabel = DIMENSIONS.find((d) => d.value === dimension)!.label;
  const drillCountry = dimension === "country" ? "" : country; // a country filter is meaningless when grouping by country

  useEffect(() => {
    setError(null);
    getSummary().then(setSummary).catch(fail);
    getFilterOptions().then(setOptions).catch(() => setOptions(null)); // dropdown values are optional
    getOutliers(25).then(setOutliers).catch(fail);
  }, [attempt]);

  useEffect(() => {
    let cancelled = false;
    getBreakdown(dimension, drillCountry ? { country: drillCountry } : {})
      .then((result) => {
        if (!cancelled) setGroups(dimension === "seniority" ? sortBySeniority(result) : result);
      })
      .catch((e: Error) => !cancelled && fail(e));
    return () => {
      cancelled = true;
    };
  }, [dimension, drillCountry, attempt]);

  return (
    <>
      <Title order={1} mb="md">
        Insights
      </Title>
      {error && (
        <Alert color="red" title="Could not load insights" mb="md">
          <Text>{error}</Text>
          <Button mt="sm" variant="light" color="red" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        </Alert>
      )}
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
      {groups.length > 0 && (
        <Box role="img" aria-label={`Bar chart of median pay in USD by ${dimensionLabel.toLowerCase()}`} mb="md">
          <BarChart
            h={280}
            data={groups.map((g) => ({ name: g.key, median: g.usd.median ?? 0 }))}
            dataKey="name"
            series={[{ name: "median", label: "Median pay (USD)", color: "blue.6" }]}
            valueFormatter={(v) => formatMoney(v, "USD")}
            tickLine="y"
          />
        </Box>
      )}
      <BreakdownTable caption={`Pay by ${dimensionLabel.toLowerCase()}`} label={dimensionLabel} groups={groups} />

      <Title order={2} size="h3" mt="xl" mb={4}>
        Pay outliers
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        People paid well above or below the median of their peers (same country, job title and seniority; groups of
        fewer than 5 are skipped). Worth a look, not necessarily wrong.
      </Text>
      {outliers?.length === 0 && <Text>No unusual pay found.</Text>}
      {outliers && outliers.length > 0 && <OutlierTable outliers={outliers} />}
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

function OutlierTable({ outliers }: { outliers: Outlier[] }) {
  return (
    <Table.ScrollContainer minWidth={720}>
      <Table aria-label="Pay outliers">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Country</Table.Th>
            <Table.Th ta="right">Salary</Table.Th>
            <Table.Th ta="right">Peer median (USD)</Table.Th>
            <Table.Th>Difference</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {outliers.map((o) => (
            <Table.Tr key={o.id}>
              <Table.Td>{o.full_name}</Table.Td>
              <Table.Td>
                {o.job_title} ({o.seniority})
              </Table.Td>
              <Table.Td>{o.country}</Table.Td>
              <Table.Td ta="right">{formatMoney(o.annual_salary, o.currency)}</Table.Td>
              <Table.Td ta="right">{formatMoney(o.peer_median_usd, "USD")}</Table.Td>
              <Table.Td>
                <Badge color={o.direction === "above" ? "orange" : "blue"} variant="light">
                  {formatDeviation(o.deviation_pct)}
                </Badge>{" "}
                <Text span size="xs" c="dimmed">
                  {o.direction} peers
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
