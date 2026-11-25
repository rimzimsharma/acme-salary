"use client";

import { Paper, SimpleGrid, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { getSummary } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Summary } from "@/lib/types";

export function InsightsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    getSummary().then(setSummary);
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
    </>
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
