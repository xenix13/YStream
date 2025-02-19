import { Stack, Checkbox, Typography } from "@mui/material";
import React from "react";

function CheckBoxOption({
  title,
  checked,
  onChange,
}: {
  title: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Checkbox
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <Typography>{title}</Typography>
    </Stack>
  );
}

export default CheckBoxOption;
