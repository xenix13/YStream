import { Typography, Box } from "@mui/material";
import React, { useState } from "react";

interface Item {
  id: string;
  content: string;
}

function SettingsRecommendations() {
  const [selectedItems, setSelectedItems] = useState<Item[]>([
    { id: "item-1", content: "Item 1" },
    { id: "item-2", content: "Item 2" },
    { id: "item-3", content: "Item 3" },
  ]);

  const [avaliableItems, setAvaliableItems] = useState<Item[]>([
    { id: "item-4", content: "Item 4" },
    { id: "item-5", content: "Item 5" },
    { id: "item-6", content: "Item 6" },
  ]);

  return (
    <>
      <Typography variant="h4">Experience - Recommendations</Typography>

      <Box
        sx={{
          mt: 2,
          width: "100%",
          height: "40px",
          backgroundColor: "#181818",
          borderRadius: "10px",
        }}
      />

      <Box sx={{ mt: 2, display: "flex", gap: 2, width: "50%" }}>

      </Box>
    </>
  );
}
export default SettingsRecommendations;