"use client";

import { Anchor, Group, Text } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/employees", label: "Employees" },
  { href: "/insights", label: "Insights" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header style={{ borderBottom: "1px solid var(--mantine-color-gray-3)", background: "var(--mantine-color-body)" }}>
      <Group h={56} px="md" maw={1280} mx="auto" justify="space-between">
        <Text fw={700}>ACME Salary Management</Text>
        <Group component="nav" aria-label="Main" gap="lg">
          {LINKS.map(({ href, label }) => (
            <Anchor
              key={href}
              component={Link}
              href={href}
              fw={pathname.startsWith(href) ? 700 : 400}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              {label}
            </Anchor>
          ))}
        </Group>
      </Group>
    </header>
  );
}
