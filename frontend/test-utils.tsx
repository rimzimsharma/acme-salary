import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

/** Renders a component inside the same providers the app uses. */
export function renderWithProviders(ui: ReactElement) {
  return render(
    <MantineProvider>
      <Notifications />
      {ui}
    </MantineProvider>,
  );
}
