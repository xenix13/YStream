import { SkipNext } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { queryBuilder } from "../plex/QuickFunctions";
import { useUserSettings } from "../states/UserSettingsState";

function PlaybackNextEPButton({
  player,
  playing,
  playbackBarRef,
  metadata,
  playQueue,
  navigate,
}: {
  player: React.MutableRefObject<any>;
  playing: boolean;
  playbackBarRef: React.MutableRefObject<HTMLDivElement | null>;
  metadata: any;
  playQueue: any;
  navigate: (path: string) => void;
}) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const countdownDuration = metadata.type === "movie" ? 10 : 3;

  const enableAutoNext = useUserSettings.getState().settings.AUTO_NEXT_EP === "true";

  // Start countdown when a next episode is available
  useEffect(() => {
    if (metadata?.Marker && playQueue && playQueue[1]) {
      setCountdown(countdownDuration);
    }
  }, [metadata, playQueue]);

  // Handle countdown timer
  useEffect(() => {
    if (countdown === null || isHovering || !playing || !enableAutoNext) return;

    if (countdown <= 0) {
      // Auto-navigate when timer reaches 0
      handleNavigation();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 0.1 : null));
    }, 100);

    return () => clearTimeout(timer);
  }, [countdown, isHovering, playing]);

  const handleNavigation = () => {
    if (!player.current || !metadata?.Marker) return;

    if (metadata.type === "movie")
      return navigate(
        `/browse/${metadata.librarySectionID}?${queryBuilder({
          mid: metadata.ratingKey,
        })}`
      );

    if (!playQueue) return;
    const next = playQueue[1];
    if (!next)
      return navigate(
        `/browse/${metadata.librarySectionID}?${queryBuilder({
          mid: metadata.grandparentRatingKey,
          pid: metadata.parentRatingKey,
          iid: metadata.ratingKey,
        })}`
      );

    navigate(`/watch/${next.ratingKey}?t=0`);
  };

  // Calculate progress percentage
  const progressPercentage =
    countdown !== null
      ? ((countdownDuration - countdown) / countdownDuration) * 100
      : 0;

  return (
    <Button
      sx={{
        width: "auto",
        px: 3,
        py: 1,
        position: "relative",
        overflow: "hidden",
        background: (theme) =>
          `linear-gradient(90deg, 
        ${theme.palette.primary.main} ${progressPercentage}%, 
        ${theme.palette.background.paper} ${progressPercentage}%)`,
        color: (theme) => theme.palette.text.primary,
        transition: "all 0.1s linear",

        "&:hover": {
          background: (theme) => theme.palette.primary.dark,
          color: (theme) => theme.palette.text.primary,
          boxShadow: "0px 0px 10px 0px #000000AA",
          px: 4,
        },
      }}
      variant="contained"
      onClick={handleNavigation}
      onMouseEnter={() => setIsHovering(true)}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.25s",
          gap: 1,
        }}
      >
        <SkipNext />{" "}
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: "bold",
          }}
        >
          {metadata.type === "movie"
            ? "Skip Credits"
            : playQueue && playQueue[1]
            ? `Next Episode`
            : "Return to Show"}
        </Typography>
      </Box>
    </Button>
  );
}

export default PlaybackNextEPButton;
