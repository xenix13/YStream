import { Typography, Box } from "@mui/material";
import React from "react";
import CheckBoxOption from "../../components/settings/CheckBoxOption";
import { useUserSettings } from "../../states/UserSettingsState";

function SettingsPlayback() {
  const { settings, setSetting } = useUserSettings();

  return (
    <>
      <Typography variant="h4">Experience - Playback</Typography>

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
          title="Disable watchscreen darkening"
          checked={settings.DISABLE_WATCHSCREEN_DARKENING === "true"}
          onChange={() => {
            setSetting("DISABLE_WATCHSCREEN_DARKENING", settings["DISABLE_WATCHSCREEN_DARKENING"] === "true" ? "false" : "true");
          }}
        />
      </Box>
    </>
  );
}

export default SettingsPlayback;
