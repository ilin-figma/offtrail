import type { Meta, StoryObj } from "@storybook/react";
import { AllProviders } from "data";
import { OfftrailHome } from "offtrail";

const meta: Meta<typeof OfftrailHome> = {
  component: OfftrailHome,
  title: "Offtrail/App",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AllProviders>
        <Story />
      </AllProviders>
    ),
  ],
};

export default meta;

export const Default: StoryObj<typeof OfftrailHome> = {
  name: "Offtrail home",
};
