import { Box } from "@mui/material";
import React from "react";

function SettingsInfo() {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <img
          src="/logoBig.png"
          alt="Logo"
          style={{ width: "50%", height: "auto" }}
        />
      </Box>

      <Box sx={{ mt: 2, textAlign: "left", color: "#fff" }}>
        <h2>Thank You for Using Nevu!</h2>
        <p>
          This project was developed by{" "}
          <a
            href="https://ipmake.dev"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#1e88e5",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Ipmake
          </a>{" "}
          and the amazing contributors from the open-source community.
        </p>
        <p>
          Nevu is designed to enhance your media experience with Plex, providing
          additional features and improvements.
        </p>
        <p>
          We would like to extend our gratitude to all the contributors and
          sponsors who have helped make this project a success.
        </p>
        <Box sx={{ mt: 2 }}>
          <a
            href="https://github.com/Ipmake/Nevu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#1e88e5",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            Visit our GitHub Repository
          </a>
        </Box>
        <Box sx={{ mt: 2 }}>
          <a
            href="https://g.ipmake.dev/perplexed"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#1e88e5",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            Become a Sponsor
          </a>
        </Box>
        <Box sx={{ mt: 2 }}>
          <a
            href="https://github.com/Ipmake/Nevu/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#1e88e5",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            Report an Issue
          </a>
        </Box>
        <Box
          sx={{
            mt: 4,
            p: 1,
            backgroundColor: "#181818",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <p>
            If you enjoy using Nevu, please consider donating to support
            the development of the project.
          </p>
        </Box>
      </Box>
    </>
  );
}

export default SettingsInfo;
