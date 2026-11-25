import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";

import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";

export const metadata: Metadata = {
  title: "ACME Salary Management",
  description: "Manage employee salaries and see how the organisation pays its people.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <Notifications position="top-right" />
          <AppNav />
          <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px" }}>{children}</main>
        </MantineProvider>
      </body>
    </html>
  );
}
