import {
  Avatar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Popover,
  Rating,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { JSX, useEffect, useState } from "react";
import {
  getLibraryMeta,
  getLibraryMetaChildren,
  getTranscodeImageURL,
  setMediaPlayedStatus,
  setMediaRating,
} from "../plex";
import {
  CheckCircleRounded,
  CloseRounded,
  PlayArrowRounded,
  VolumeOffRounded,
  VolumeUpRounded,
  CheckCircleOutlineRounded,
  StarRounded,
  StarOutlineRounded,
} from "@mui/icons-material";
import { durationToText } from "./MovieItemSlider";
import ReactPlayer from "react-player";
import { usePreviewPlayer } from "../states/PreviewPlayerState";
import MovieItem from "./MovieItem";
import { useBigReader } from "./BigReader";
import { useWatchListCache } from "../states/WatchListCache";
import { useInView } from "react-intersection-observer";
import { WatchListButton } from "./MovieItem";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { useConfirmModal } from "./ConfirmModal";

function MetaScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { MetaScreenPlayerMuted, setMetaScreenPlayerMuted } =
    usePreviewPlayer();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<Plex.Metadata | undefined>(undefined);

  const [page, setPage] = useState<number>(0);

  const [selectedSeason, setSelectedSeason] = useState<number>(0);
  const [episodes, setEpisodes] = useState<Plex.Metadata[] | null>();

  const [languages, setLanguages] = useState<string[] | null>(null);
  const [subTitles, setSubTitles] = useState<string[] | null>(null);

  const [previewVidURL, setPreviewVidURL] = useState<string | null>(null);
  const [previewVidPlaying, setPreviewVidPlaying] = useState<boolean>(false);

  const WatchList = useWatchListCache();

  const mid = searchParams.get("mid");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchParams(new URLSearchParams());
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setData(undefined);
    setLoading(true);
    setEpisodes(null);
    setSelectedSeason(0);
    setLanguages(null);
    setSubTitles(null);
    setPreviewVidURL(null);
    setPreviewVidPlaying(false);
    setPage(0);

    if (!mid) return;
    getLibraryMeta(mid).then((res) => {
      setSelectedSeason((res.OnDeck?.Metadata?.parentIndex ?? 1) - 1);
      setData(res);
      setLoading(false);
    });
  }, [mid]);

  useEffect(() => {
    if (!data) return;

    if (
      !data?.Extras?.Metadata?.[0] ||
      !data?.Extras?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key
    )
      return;

    setPreviewVidURL(
      `${localStorage.getItem("server")}${
        data?.Extras?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key
      }&X-Plex-Token=${localStorage.getItem("accessToken")}`
    );

    const timeout = setTimeout(() => {
      setPreviewVidPlaying(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [data]);

  useEffect(() => {
    if (languages || subTitles) return;
    if (!data) return;

    switch (data.type) {
      case "show":
        {
          if (!episodes) return;

          // get the first episode to get the languages and subtitles
          const firstEpisode = episodes[0];

          // you need to request the full metadata for the episode to get the media info
          getLibraryMeta(firstEpisode.ratingKey).then((res) => {
            if (!res.Media?.[0]?.Part?.[0]?.Stream) return;

            const uniqueLanguages = Array.from(
              new Set(
                res.Media?.[0]?.Part?.[0]?.Stream?.filter(
                  (stream) => stream.streamType === 2
                ).map((stream) => stream.language ?? stream.displayTitle)
              )
            );
            const uniqueSubTitles = Array.from(
              new Set(
                res.Media?.[0]?.Part?.[0]?.Stream?.filter(
                  (stream) => stream.streamType === 3
                ).map((stream) => stream.language)
              )
            );

            setLanguages(uniqueLanguages);
            setSubTitles(uniqueSubTitles);
          });
        }
        break;
      case "movie":
        {
          if (!data.Media?.[0]?.Part?.[0]?.Stream) return;

          const uniqueLanguages = Array.from(
            new Set(
              data.Media?.[0]?.Part?.[0]?.Stream?.filter(
                (stream) => stream.streamType === 2
              ).map((stream) => stream.language ?? stream.displayTitle)
            )
          );
          const uniqueSubTitles = Array.from(
            new Set(
              data.Media?.[0]?.Part?.[0]?.Stream?.filter(
                (stream) => stream.streamType === 3
              ).map((stream) => stream.language)
            )
          );

          setLanguages(uniqueLanguages);
          setSubTitles(uniqueSubTitles);
        }
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.ratingKey, episodes]);

  useEffect(() => {
    setEpisodes(null);
    if (!data) return;
    if (
      data?.type === "show" &&
      data?.Children?.Metadata[selectedSeason]?.ratingKey
    ) {
      getLibraryMetaChildren(
        data?.Children?.Metadata[selectedSeason]?.ratingKey as string
      ).then((res) => {
        setEpisodes(res);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeason, data]);

  if (!searchParams.has("mid")) return <></>;

  if (loading)
    return (
      <Backdrop open={true}>
        <CircularProgress />
      </Backdrop>
    );

  return (
    <Backdrop
      open={searchParams.has("mid")}
      sx={{
        overflowY: "scroll",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={() => {
        setSearchParams(new URLSearchParams());
      }}
    >
      <Box
        sx={{
          width: "130vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          backgroundColor: "#121216",
          mt: 4,
          pb: "20vh",

          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            aspectRatio: "16/9",
            backgroundImage: `url(${localStorage.getItem("server")}${
              data?.art
            }?X-Plex-Token=${localStorage.getItem("accessToken")})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#000000AA",
            backgroundBlendMode: "darken",

            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: "1%",
            borderTopLeftRadius: "10px",
            borderTopRightRadius: "10px",
            position: "relative",
            zIndex: 0,
            userSelect: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              // make it take up the full width of the parent
              width: "100%",
              aspectRatio: "16/9",
              left: 0,
              top: 0,
              filter: "brightness(0.5)",
              opacity: previewVidPlaying ? 1 : 0,
              transition: "all 2s ease",
              backgroundColor: previewVidPlaying ? "#000000" : "transparent",
              pointerEvents: "none",

              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              overflow: "hidden",
            }}
          >
            <ReactPlayer
              url={previewVidURL ?? undefined}
              controls={false}
              width="100%"
              height="100%"
              autoplay={true}
              playing={previewVidPlaying}
              volume={MetaScreenPlayerMuted ? 0 : 0.5}
              muted={MetaScreenPlayerMuted}
              onEnded={() => {
                setPreviewVidPlaying(false);
              }}
              pip={false}
              config={{
                file: {
                  attributes: { disablePictureInPicture: true },
                },
              }}
            />
          </Box>
          <Box
            sx={{
              ml: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 2,
            }}
          >
            <IconButton
              sx={{
                backgroundColor: "#00000088",
              }}
              onClick={() => {
                setSearchParams(new URLSearchParams());
              }}
            >
              <CloseRounded fontSize="medium" />
            </IconButton>

            <IconButton
              sx={{
                backgroundColor: "#00000088",
                opacity: previewVidURL ? 1 : 0,
                transition: "all 1s ease",
              }}
              onClick={() => {
                setMetaScreenPlayerMuted(!MetaScreenPlayerMuted);
              }}
            >
              {MetaScreenPlayerMuted ? (
                <VolumeOffRounded />
              ) : (
                <VolumeUpRounded />
              )}
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            mt: "-15vh",
            height: "30vh",
            width: "100%",
            background:
              "linear-gradient(180deg, #12121600, #121216FF, #121216FF)",
            zIndex: 1,
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "0 3%",
            mt: "-55vh",
            gap: "3%",
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              width: "30%",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: (theme) =>
                `0 20px 25px -5px ${theme.palette.common.black}`,
              position: "relative",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.02)",
                boxShadow: (theme) =>
                  `0 25px 30px -5px ${theme.palette.common.black}`,
              },
            }}
          >
            <img
              src={`${getTranscodeImageURL(
                `${data?.thumb}?X-Plex-Token=${localStorage.getItem(
                  "accessToken"
                )}`,
                600,
                900
              )}`}
              alt={data?.title || ""}
              style={{
                width: "100%",
                aspectRatio: "2/3",
                backgroundColor: "#00000088",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>

          <Box
            sx={{
              width: "70%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              height: "100%",
              marginLeft: "1%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                width: "100%",
                height: "65%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mb: "-10px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "24px",
                    fontWeight: "900",
                    letterSpacing: "0.1em",
                    color: (theme) => theme.palette.primary.main,
                    textTransform: "uppercase",
                  }}
                >
                  {data?.type}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: "3rem",
                  fontWeight: "bold",
                  mt: 0,
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                {data?.title}
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mt: -1,
                  gap: 1,
                }}
              >
                {data?.type === "show" &&
                  data?.leafCount === data?.viewedLeafCount && (
                    <CheckCircleRounded
                      sx={{
                        color: (theme) => theme.palette.primary.light,
                        fontSize: "large",
                      }}
                    />
                  )}
                {data?.type === "movie" && (data?.viewCount ?? 0) > 0 && (
                  <CheckCircleRounded
                    sx={{
                      color: (theme) => theme.palette.primary.light,
                      fontSize: "large",
                    }}
                  />
                )}
                {data?.contentRating && (
                  <Typography
                    sx={{
                      fontSize: "medium",
                      fontWeight: "light",
                      color: (theme) => theme.palette.text.secondary,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: "5px",
                      px: 1,
                      py: 0.2,
                    }}
                  >
                    {data?.contentRating}
                  </Typography>
                )}
                {data?.year && (
                  <Typography
                    sx={{
                      fontSize: "medium",
                      fontWeight: "light",
                      color: (theme) => theme.palette.text.secondary,
                    }}
                  >
                    {data?.year}
                  </Typography>
                )}
                {data?.rating && (
                  <Typography
                    sx={{
                      fontSize: "medium",
                      fontWeight: "light",
                      color: (theme) => theme.palette.text.secondary,
                    }}
                  >
                    {data?.rating}
                  </Typography>
                )}
                {data?.duration &&
                  ["episode", "movie"].includes(data?.type) && (
                    <Typography
                      sx={{
                        fontSize: "medium",
                        fontWeight: "light",
                        color: (theme) => theme.palette.text.secondary,
                      }}
                    >
                      {durationToText(data?.duration)}
                    </Typography>
                  )}
                {data?.type === "show" &&
                  data?.leafCount &&
                  data?.childCount && (
                    <Typography
                      sx={{
                        fontSize: "medium",
                        fontWeight: "light",
                        color: (theme) => theme.palette.text.secondary,
                      }}
                    >
                      {data?.childCount > 1
                        ? `${data?.childCount} Seasons`
                        : `${data?.leafCount} Episode${
                            data?.leafCount > 1 ? "s" : ""
                          }`}
                    </Typography>
                  )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button
                  variant="contained"
                  sx={{
                    height: "38px",
                    backgroundColor: (theme) => theme.palette.background.paper,
                    color: (theme) => theme.palette.text.primary,
                    fontWeight: "bold",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    "&:hover": {
                      backgroundColor: (theme) => theme.palette.primary.dark,
                    },
                    gap: 1,
                    transition: "all 0.2s ease-in-out",
                  }}
                  onClick={async () => {
                    if (data?.type === "movie")
                      navigate(
                        `/watch/${data?.ratingKey}${
                          data?.viewOffset ? `?t=${data?.viewOffset}` : ""
                        }`
                      );

                    if (data?.type === "show") {
                      if (data?.OnDeck && data?.OnDeck.Metadata) {
                        navigate(
                          `/watch/${data?.OnDeck.Metadata.ratingKey}${
                            data?.OnDeck.Metadata.viewOffset
                              ? `?t=${data?.OnDeck.Metadata.viewOffset}`
                              : ""
                          }`
                        );
                      } else {
                        const firstSeason = await getLibraryMetaChildren(
                          data?.Children?.Metadata[0]?.ratingKey as string
                        );

                        if (firstSeason)
                          navigate(`/watch/${firstSeason[0].ratingKey}`);
                      }
                    }
                  }}
                >
                  <PlayArrowRounded fontSize="medium" /> Play{" "}
                  {data?.type === "show" &&
                    data?.OnDeck &&
                    data?.OnDeck.Metadata &&
                    `${
                      data?.Children?.size && data?.Children?.size > 1
                        ? `S${data?.OnDeck.Metadata.parentIndex}`
                        : ""
                    }E${data?.OnDeck.Metadata.index}`}
                </Button>

                <Tooltip placement="top" arrow title="Watchlist">
                  <WatchListButton item={data as Plex.Metadata} />
                </Tooltip>

                {data && <RatingButton item={data} />}

                <Tooltip
                  placement="top"
                  arrow
                  title={
                    `Mark as ` +
                    (data?.type === "movie"
                      ? !Boolean(data?.viewCount)
                        ? "watched"
                        : "unwatched"
                      : data?.viewedLeafCount === data?.leafCount
                      ? "watched"
                      : "unwatched")
                  }
                >
                  <Button
                    variant="contained"
                    sx={{
                      height: "38px",
                      backgroundColor: (theme) =>
                        theme.palette.background.paper,
                      color: (theme) => theme.palette.text.primary,
                      fontWeight: "bold",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      "&:hover": {
                        backgroundColor: (theme) => theme.palette.primary.main,
                      },
                      transition: "all 0.2s ease-in-out",
                      display: "flex",
                      gap: 1,
                    }}
                    onClick={async () => {
                      if (!data) return;
                      let state = "unwatched";

                      if (data?.type === "movie" && (data?.viewCount ?? 0) > 0)
                        state = "watched";
                      if (
                        data?.type === "show" &&
                        data?.viewedLeafCount === data?.leafCount
                      )
                        state = "watched";

                      useConfirmModal.getState().setModal({
                        title: `Mark as ${
                          state === "unwatched" ? "watched" : "unwatched"
                        }`,
                        message: `Are you sure you want to mark ${
                          data?.title
                        } as ${
                          state === "unwatched" ? "watched" : "unwatched"
                        }?`,
                        onConfirm: async () => {
                          switch (data.type) {
                            case "movie":
                              data.viewCount = !Boolean(data.viewCount) ? 1 : 0;
                              setData({ ...data });
                              await setMediaPlayedStatus(
                                Boolean(data.viewCount),
                                data.ratingKey
                              );
                              break;
                            case "show":
                              const newViewedLeafCount =
                                data.viewedLeafCount === data.leafCount
                                  ? 0
                                  : data.leafCount;
                              data.viewedLeafCount = newViewedLeafCount;
                              setData({ ...data });
                              await setMediaPlayedStatus(
                                newViewedLeafCount === data.leafCount,
                                data.ratingKey
                              );
                              break;
                            default:
                              break;
                          }
                        },
                        onCancel: () => {},
                      });
                    }}
                  >
                    {data?.type === "movie" ? (
                      !((data?.viewCount ?? 0) > 0) ? (
                        <CheckCircleOutlineRounded fontSize="small" />
                      ) : (
                        <CheckCircleRounded fontSize="small" />
                      )
                    ) : data?.type === "show" ? (
                      data?.viewedLeafCount === data?.leafCount ? (
                        <CheckCircleRounded fontSize="small" />
                      ) : (
                        <CheckCircleOutlineRounded fontSize="small" />
                      )
                    ) : null}
                  </Button>
                </Tooltip>
              </Box>

              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 0.5,
                  mt: 2,
                }}
              >
                <Typography color="text.secondary">Genres: </Typography>
                {data?.Genre?.slice(0, 5).map((genre, index) => (
                  <Typography
                    key={genre.id}
                    sx={{
                      color: (theme) => theme.palette.text.primary,
                      fontWeight: "medium",
                      cursor: "pointer",
                      "&:hover": {
                        color: (theme) => theme.palette.primary.main,
                        textDecoration: "none",
                      },
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => {
                      setSearchParams(
                        new URLSearchParams({
                          bkey: `/library/sections/${data?.librarySectionID}/genre/${genre.id}`,
                        })
                      );
                    }}
                  >
                    {genre.tag}
                    {index + 1 === data?.Genre?.slice(0, 5).length ? "" : ","}
                  </Typography>
                ))}
              </Box>

              <Collapse in={Boolean(languages || subTitles)}>
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 0.5,
                    }}
                  >
                    {languages && languages.length > 0 && (
                      <>
                        <Typography color="text.secondary">Audio: </Typography>
                        {languages.slice(0, 10).map((lang, index) => (
                          <Typography
                            key={index}
                            sx={{
                              color: (theme) => theme.palette.text.primary,
                              fontWeight: "medium",
                            }}
                          >
                            {lang}
                            {index + 1 === languages.slice(0, 10).length
                              ? ""
                              : ","}
                          </Typography>
                        ))}
                      </>
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 0.5,
                      whiteSpace: "wrap",
                      overflow: "hidden",
                    }}
                  >
                    {subTitles && subTitles.length > 0 && (
                      <>
                        <Typography color="text.secondary">
                          Subtitles:{" "}
                        </Typography>
                        {subTitles.slice(0, 10).map((lang, index) => (
                          <Typography
                            key={index}
                            sx={{
                              color: (theme) => theme.palette.text.primary,
                              fontWeight: "medium",
                            }}
                          >
                            {lang}
                            {index + 1 === subTitles.slice(0, 10).length
                              ? ""
                              : ","}
                          </Typography>
                        ))}
                      </>
                    )}
                  </Box>
                </Box>
              </Collapse>

              <Typography
                sx={{
                  mt: 1.5,
                  fontSize: "1rem",
                  fontWeight: "normal",
                  // max 5 lines
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: "vertical",
                  maxInlineSize: "100%",
                  userSelect: "none",
                  cursor: "zoom-in",
                  color: (theme) => theme.palette.text.secondary,
                }}
                onClick={() => {
                  if (!data?.summary) return;
                  useBigReader.getState().setBigReader(data?.summary);
                }}
              >
                {data?.summary}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            width: "100%",
            px: "3%",
            mt: "3vh",
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 4,
              mb: "10px",
            }}
          >
            <TabButton
              onClick={() => {
                setPage(0);
              }}
              selected={page === 0}
              text={data?.type === "movie" ? "Similar Movies" : "Episodes"}
            />

            {data?.type !== "movie" && (
              <TabButton
                onClick={() => {
                  setPage(1);
                }}
                selected={page === 1}
                text="Recommendations"
              />
            )}

            <TabButton
              onClick={() => {
                setPage(2);
              }}
              selected={page === 2}
              text="Info"
            />

            {data?.type === "show" &&
              data?.Children &&
              data?.Children.size > 1 && (
                <Select
                  sx={{
                    ml: "auto",
                    opacity: page === 0 ? 1 : 0,
                    transition: "all 0.5s ease",
                  }}
                  size="small"
                  value={selectedSeason}
                  onChange={(e) => {
                    if (e.target.value === selectedSeason) return;
                    setSelectedSeason(e.target.value as number);
                  }}
                >
                  {data?.type === "show" &&
                    data?.Children?.Metadata?.map((season, index) => (
                      <MenuItem key={index} value={index}>
                        {season.title}
                      </MenuItem>
                    ))}
                </Select>
              )}
          </Box>

          <Divider sx={{ mb: 2, width: "100%" }} />

          <AnimatePresence mode="wait">
            {page === 0 && MetaPage1(data, loading, episodes, navigate)}
            {page === 1 && MetaPage2(data)}
            {page === 2 && MetaPage3(data)}
          </AnimatePresence>
        </Box>
      </Box>
    </Backdrop>
  );
}

export default MetaScreen;

function MetaPage1(
  data: Plex.Metadata | undefined,
  loading: boolean,
  episodes: Plex.Metadata[] | null | undefined,
  navigate: (path: string) => void
) {
  return (
    <>
      {data?.type === "movie" && !data && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            mt: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {data?.type === "movie" && data.Related?.Hub?.[0] && (
        <Grid
          container
          spacing={2}
          sx={{
            width: "100%",
          }}
        >
          {data.Related?.Hub?.[0]?.Metadata?.slice(0, 10).map((movie) => (
            <Grid size={{ lg: 3, md: 4, sm: 6, xs: 12 }}>
              <MovieItem item={movie} />
            </Grid>
          ))}
        </Grid>
      )}

      {data?.type === "show" && !episodes && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            mt: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {data?.type === "show" && episodes && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: 1,
          }}
        >
          {episodes?.map((episode) => (
            <EpisodeItem
              item={episode}
              onClick={() => {
                navigate(
                  `/watch/${episode.ratingKey}${
                    episode.viewOffset ? `?t=${episode.viewOffset} ` : ""
                  }`
                );
              }}
            />
          ))}
        </Box>
      )}
    </>
  );
}

function MetaPage2(data: Plex.Metadata | undefined) {
  if (!data) return <></>;
  if (data.Related?.Hub?.length === 0) return <>Nothing here</>;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: "60px",

        userSelect: "none",
      }}
    >
      {data.Related?.Hub?.map((hub) => (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#FFFFFF",
            }}
          >
            {hub.title}
          </Typography>

          <Grid container spacing={2} sx={{ width: "100%" }}>
            {hub.Metadata?.map((item) => (
              <Grid size={{ lg: 3, md: 4, sm: 6, xs: 12 }}>
                <MovieItem item={item} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}

function MetaPage3(data: Plex.Metadata | undefined) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: "60px",

        userSelect: "none",
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#FFFFFF",
          }}
        >
          Cast
        </Typography>

        <Grid container spacing={2}>
          {data?.Role?.map((role) => (
            <ActorItem role={role} data={data} />
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

function ActorItem({
  role,
  data,
}: {
  role: Plex.Role;
  data: Plex.Metadata;
}): JSX.Element {
  const { inView, ref } = useInView();
  const [, setSearchParams] = useSearchParams();

  return (
    <Grid size={{ xl: 3, lg: 4, md: 6, sm: 6, xs: 6 }} ref={ref}>
      {inView ? (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "20px",
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, 0.4),
            padding: "10px 20px",
            borderRadius: "10px",
            userSelect: "none",
            cursor: "pointer",
            transition: "transform 0.2s ease",

            "&:hover": {
              backgroundColor: (theme) =>
                alpha(theme.palette.background.paper, 0.7),
              transform: "translateY(-2px)",
            },
          }}
          onClick={() => {
            setSearchParams(
              new URLSearchParams({
                bkey: `/library/sections/${data.librarySectionID}/actor/${role.id}`,
              })
            );
          }}
        >
          <Avatar
            src={`${getTranscodeImageURL(
              `${role.thumb}?X-Plex-Token=${localStorage.getItem(
                "accessToken"
              )}`,
              200,
              200
            )}`}
            sx={{
              width: "25%",
              height: "auto",
              aspectRatio: "1/1",
              borderRadius: "50%",
            }}
          />

          <Box
            sx={{
              width: "75%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              overflow: "hidden",
            }}
          >
            <Typography
              sx={{
                fontSize: "1rem",
                color: (theme) => theme.palette.text.primary,
                fontWeight: "medium",
              }}
            >
              {role.tag}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: (theme) => theme.palette.text.secondary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                whiteSpace: "nowrap",
                width: "100%",
              }}
            >
              {role.role}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100px",
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, 0.2),
            borderRadius: "10px",
          }}
        />
      )}
    </Grid>
  );
}

function RatingButton({ item }: { item: Plex.Metadata }): JSX.Element {
  const [rating, setRating] = useState<number | null>(
    (item.userRating && item.userRating / 2) ?? null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Popover
        anchorEl={anchorEl}
        open={anchorEl !== null}
        onClick={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        sx={{
          "& .MuiPopover-paper": {
            padding: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: (theme) => theme.palette.background.paper,
          },
        }}
      >
        <Rating
          name="simple-controlled"
          value={rating}
          precision={0.5}
          size="large"
          onChange={(e, v) => {
            setRating(v);

            if (v === null) return;

            item.rating = v * 2;
            setMediaRating(v * 2, item.ratingKey);
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setRating(null);
            item.rating = undefined;
            setMediaRating(-1, item.ratingKey);
          }}
        />
      </Popover>
      <Button
        variant="contained"
        sx={{
          height: "38px",
          backgroundColor: (theme) => theme.palette.background.paper,
          color: (theme) => theme.palette.text.primary,
          fontWeight: "bold",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          "&:hover": {
            backgroundColor: (theme) => theme.palette.primary.main,
          },
          transition: "all 0.2s ease-in-out",
          display: "flex",
          gap: 1,
        }}
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setRating(null);
          item.rating = undefined;
          setMediaRating(-1, item.ratingKey);
        }}
      >
        {rating ? (
          <StarRounded fontSize="small" />
        ) : (
          <StarOutlineRounded fontSize="small" />
        )}
      </Button>
    </>
  );
}

function EpisodeItem({
  item,
  onClick,
}: {
  item: Plex.Metadata;
  onClick?: (event: React.MouseEvent) => void;
}): JSX.Element {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: 2,
        userSelect: "none",
        cursor: "pointer",
        borderRadius: "10px",
        p: 1.5,
        mb: 1,
        transition: "all 0.5s ease",
        "&:hover": {
          backgroundColor: (theme) =>
            alpha(theme.palette.background.paper, 0.5),
          transition: "all 0.2s ease",
        },

        // on hover get the 2nd child and then the 1st child of that
        "&:hover > :nth-child(2)": {
          "& > :nth-child(1)": {
            opacity: 1,
            transition: "all 0.2s ease-in",
          },
        },
      }}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
    >
      <Box
        sx={{
          width: "5%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: (theme) => theme.palette.text.primary,
            textAlign: "center",
          }}
        >
          {item.index}
        </Typography>
      </Box>

      <Box
        sx={{
          width: "20%",
          borderRadius: "8px",
          aspectRatio: "16/9",
          backgroundImage: `url(${getTranscodeImageURL(
            `${item.thumb}?X-Plex-Token=${localStorage.getItem("accessToken")}`,
            380,
            214
          )})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "darken",
          overflow: "hidden",
          whiteSpace: "nowrap",
          transition: "all 0.3s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          position: "relative",
          boxShadow: (theme) =>
            `0 4px 6px -1px ${alpha(theme.palette.common.black, 0.2)}`,
        }}
      >
        <PlayArrowRounded
          sx={{
            color: "#FFFFFF",
            fontSize: "400%",
            m: "auto",
            opacity: 0,
            backgroundColor: "#00000088",
            borderRadius: "50%",
            transition: "all 0.3s ease-out",
          }}
        />

        {(item.viewOffset || (item.viewCount && item.viewCount >= 1)) && (
          <LinearProgress
            value={
              item.viewOffset ? (item.viewOffset / item.duration) * 100 : 100
            }
            variant="determinate"
            sx={{
              width: "100%",
              height: "4px",
              backgroundColor: (theme) =>
                alpha(theme.palette.common.black, 0.5),

              position: "absolute",
              bottom: 0,
              "& .MuiLinearProgress-bar": {
                backgroundColor: (theme) => theme.palette.primary.main,
              },
            }}
          />
        )}
      </Box>

      <Box
        sx={{
          width: "70%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          ml: 0.5,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: (theme) => theme.palette.text.primary,
              // make it so the text doesnt resize the parent nor overflow max 3 rows
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              maxWidth: "80%",
            }}
          >
            {item.title}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 1,
              color: (theme) => theme.palette.text.secondary,
            }}
          >
            {getMinutes(item.duration)} Min.
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: "medium",
            fontWeight: "light",
            color: (theme) => theme.palette.text.secondary,
            mt: 0.5,
            // make it so the text doesnt resize the parent nor overflow max 3 rows
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
          title={item.summary}
        >
          {item.summary}
        </Typography>
      </Box>
    </Box>
  );
}

function TabButton({
  text,
  onClick,
  selected,
}: {
  text: string;
  onClick: (event: React.MouseEvent) => void;
  selected: boolean;
}) {
  return (
    <Typography
      sx={{
        fontSize: "1.25rem",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: selected
          ? (theme) => theme.palette.primary.main
          : (theme) => theme.palette.text.disabled,
        cursor: "pointer",
        userSelect: "none",
        position: "relative",
        pb: 0.5,

        "&:after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          width: selected ? "100%" : "0%",
          height: "2px",
          backgroundColor: (theme) => theme.palette.primary.main,
          transition: "all 0.3s ease",
        },

        "&:hover": {
          color: (theme) =>
            selected ? theme.palette.primary.main : theme.palette.text.primary,

          "&:after": {
            width: "100%",
          },
        },

        transition: "all 0.3s ease",
      }}
      onClick={onClick}
    >
      {text}
    </Typography>
  );
}

/**
 * Calculates the number of minutes from a given duration in milliseconds.
 *
 * @param duration The duration in milliseconds.
 * @returns The number of minutes.
 */
export function getMinutes(duration: number): number {
  return Math.floor(duration / 60000);
}
