import { Typography, Box } from "@mui/material";
import React from "react";
import CheckBoxOption from "../../components/settings/CheckBoxOption";
import { useUserSettings } from "../../states/UserSettingsState";

function _template() {
  const { settings, setSetting } = useUserSettings();

  return (
    <>
      <Typography variant="h4">Template Title</Typography>

      <Box
        sx={{
          mt: 2,
          width: "100%",
          height: "40px",
          backgroundColor: "#181818",
          borderRadius: "10px",
        }}
      />

      <Box sx={{ mt: 2 }}>
        <CheckBoxOption
          title="Template Checkbox"
          checked={false}
          onChange={() => {}}
        />
      </Box>
    </>
  );
}

export default _template;
