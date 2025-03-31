import {
  PlayArrowRounded,
  BookmarkBorderRounded,
  CheckCircleOutlineRounded,
  BookmarkRounded,
  RecommendRounded,
  CheckCircleRounded,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Tooltip,
  Button,
  CircularProgress,
  LinearProgress,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from "@mui/material";
import React, { JSX } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getTranscodeImageURL,
  getLibraryMeta,
  getLibraryMetaChildren,
  getItemByGUID,
  setMediaPlayedStatus,
} from "../plex";
import { durationToText } from "./MovieItemSlider";
import { useWatchListCache, WatchListCacheEmitter } from "../states/WatchListCache";
import { useBigReader } from "./BigReader";

function MovieItem({
  item,
  itemsPerPage,
  index,
  PlexTvSource,
  refetchData,
}: {
  item: Plex.Metadata;
  itemsPerPage?: number;
  index?: number;
  PlexTvSource?: boolean;
  refetchData?: () => void;
}): JSX.Element {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [playButtonLoading, setPlayButtonLoading] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleClose = () => {
    setContextMenu(null);
  };

  const handlePlay = async () => {
    if (!item) return;
    setPlayButtonLoading(true);

    let PlexTvSrcData: Plex.Metadata | null = null;
    if (PlexTvSource) {
      PlexTvSrcData = await getItemByGUID(item.guid);

      if (!PlexTvSrcData) {
        useBigReader
          .getState()
          .setBigReader(`"${item.title}" is not available on this Plex Server`);
        return;
      }
    }

    if (PlexTvSource && !PlexTvSrcData) return;

    let localItem = PlexTvSource ? (PlexTvSrcData as Plex.Metadata) : item;

    switch (item.type) {
      case "movie":
      case "episode":
        navigate(
          `/watch/${localItem.ratingKey}${
            localItem.viewOffset ? `?t=${localItem.viewOffset}` : ""
          }`
        );

        setPlayButtonLoading(false);
        break;
      case "show":
        {
          const data = await getLibraryMeta(localItem.ratingKey);

          if (!data) {
            setPlayButtonLoading(false);
            return;
          }

          if (data.OnDeck?.Metadata) {
            navigate(
              `/watch/${data.OnDeck.Metadata.ratingKey}${
                data.OnDeck.Metadata.viewOffset
                  ? `?t=${data.OnDeck.Metadata.viewOffset}`
                  : ""
              }`
            );

            setPlayButtonLoading(false);
            return;
          } else {
            if (data.Children?.size === 0 || !data.Children?.Metadata[0])
              return setPlayButtonLoading(false);
            // play first episode
            const episodes = await getLibraryMetaChildren(
              data.Children?.Metadata[0].ratingKey
            );
            if (episodes?.length === 0) return setPlayButtonLoading(false);

            navigate(`/watch/${episodes[0].ratingKey}`);
          }
        }
        break;
    }
  };

  // 300 x 170
  return (
    <>
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <Typography
          sx={{
            fontSize: "1rem",
            fontWeight: "bold",
            px: 1,
            maxWidth: "200px",
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </Typography>

        <Divider
          sx={{
            my: 1,
          }}
        />

        <MenuItem
          onClick={async (e) => {
            e.stopPropagation();
            await handlePlay();
            handleClose();
          }}
        >
          <ListItemIcon>
            <PlayArrowRounded fontSize="small" />
          </ListItemIcon>
          Play
        </MenuItem>
        <MenuItem
          onClick={async (e) => {
            if (!item) return;
            handleClose();

            if (item.type === "episode")
              return setSearchParams(
                new URLSearchParams({
                  bkey: `/library/metadata/${item.grandparentRatingKey}/similar`,
                })
              );

            setSearchParams(
              new URLSearchParams({
                bkey: `/library/metadata/${item.ratingKey}/similar`,
              })
            );
          }}
        >
          <ListItemIcon>
            <RecommendRounded fontSize="small" />
          </ListItemIcon>
          View Similar
        </MenuItem>
        <MenuItem
          onClick={async () => {
            if (!item) return;
            switch (item.type) {
              case "movie":
              case "episode":
                if (
                  item.type === "episode" &&
                  (item?.viewOffset ?? 0) < item.duration
                ) {
                  item.viewCount = 1;
                } else {
                  item.viewCount = !Boolean(item.viewCount) ? 1 : 0;
                }
                await setMediaPlayedStatus(
                  Boolean(item.viewCount),
                  item.ratingKey
                );
                break;
              case "show":
                const newViewedLeafCount =
                  item.viewedLeafCount === item.leafCount ? 0 : item.leafCount;
                item.viewedLeafCount = newViewedLeafCount;
                await setMediaPlayedStatus(
                  newViewedLeafCount === item.leafCount,
                  item.ratingKey
                );
                break;
              default:
                break;
            }

            handleClose();
            refetchData?.();
          }}
        >
          <ListItemIcon>
            {item?.type === "movie" || item?.type === "episode" ? (
              !((item?.viewCount ?? 0) > 0) ? (
                <CheckCircleOutlineRounded fontSize="small" />
              ) : (
                <CheckCircleRounded fontSize="small" />
              )
            ) : item?.type === "show" ? (
              item?.viewedLeafCount === item?.leafCount ? (
                <CheckCircleRounded fontSize="small" />
              ) : (
                <CheckCircleOutlineRounded fontSize="small" />
              )
            ) : null}
          </ListItemIcon>

          {item?.type === "movie" || item?.type === "episode"
            ? item.type === "episode" && (item.viewOffset ?? 0) < item.duration
              ? "Mark as Watched"
              : !((item?.viewCount ?? 0) > 0)
              ? "Mark as Watched"
              : "Mark as Unwatched"
            : item?.type === "show"
            ? item?.viewedLeafCount === item?.leafCount
              ? "Mark as Unwatched"
              : "Mark as Watched"
            : null}
        </MenuItem>
      </Menu>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          width: itemsPerPage
            ? `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`
            : "100%",
          minWidth: itemsPerPage
            ? `calc((100vw / ${itemsPerPage}) - 10px - (5vw / ${itemsPerPage}))`
            : "100%",
          backgroundColor: "rgba(18, 18, 22, 0.9)",

          borderRadius: "7px",
          overflow: "hidden",
          mb: "0px",
          position: "relative",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.2)",

          "&:hover": {
            transform: "scale(1.08)",
            transition: "all 0.4s ease",
            zIndex: 1000,
            boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.3)",
            position: "relative",
            pb: "10px",
            mb: "-42px",
          },

          [`&:hover > :nth-child(${
            item.type === "episode" ||
            (item.type === "movie" && item.viewOffset)
              ? 4
              : 3
          })`]: {
            height: "32px",
            opacity: 1,
          },

          transition: "all 0.4s ease, transform 0.4s ease",
          cursor: "pointer",
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(
            contextMenu === null
              ? {
                  mouseX: e.clientX + 2,
                  mouseY: e.clientY - 6,
                }
              : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                // Other native context menus might behave different.
                // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                null
          );
        }}
        onClick={async () => {
          if (PlexTvSource) {
            const data = await getItemByGUID(item.guid);
            if (!data) {
              useBigReader
                .getState()
                .setBigReader(
                  `"${item.title}" is not available on this Plex Server`
                );
              return;
            }

            setSearchParams({ mid: data.ratingKey.toString() });
          } else {
            if (item.grandparentRatingKey && ["episode"].includes(item.type))
              return setSearchParams({ mid: item.grandparentRatingKey });

            setSearchParams({ mid: item.ratingKey.toString() });
          }
        }}
      >
        <Box
          sx={{
            width: "100%",
            aspectRatio: "16/9",

            backgroundImage: ["episode"].includes(item.type)
              ? `url(${getTranscodeImageURL(
                  `${item.thumb}?X-Plex-Token=${localStorage.getItem(
                    "accessToken"
                  )}`,
                  1200,
                  680
                )})`
              : `url(${getTranscodeImageURL(
                  `${item.art}?X-Plex-Token=${localStorage.getItem(
                    "accessToken"
                  )}`,
                  1200,
                  680
                )})`,
            backgroundSize: "cover",
            backgroundPosition: "center",

            position: "relative",
          }}
        >
          {((item.type === "show" && item.leafCount === item.viewedLeafCount) ||
            (item.type === "movie" &&
              item?.viewCount &&
              item.viewCount > 0)) && (
            <Box
              sx={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <Tooltip title="Watched" arrow placement="top">
                <CheckCircleOutlineRounded
                  fontSize="small"
                  sx={{
                    color: (theme) => theme.palette.primary.light,
                  }}
                />
              </Tooltip>
            </Box>
          )}
        </Box>
        {(item.type === "episode" ||
          (item.type === "movie" && item.viewOffset)) && (
          <LinearProgress
            variant="determinate"
            value={((item?.viewOffset ?? 0) / item.duration) * 100}
            sx={{
              width: "100%",
              height: "3px",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: (theme) => theme.palette.primary.main,
              },
            }}
          />
        )}
        <Box
          sx={{
            width: "100%",
            height: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            padding: "16px",
            userSelect: "none",
            transition: "all 0.4s ease",
            transform: "translateX(0%)",
            position: "relative",
            zIndex: 5,
          }}
        >
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: "500",
              letterSpacing: "0.05em",
              color: (theme) => theme.palette.primary.light,
              textTransform: "uppercase",
              opacity: 0.9,
              mb: 0.5,
            }}
          >
            {item.type} {item.type === "episode" && item.index}
          </Typography>

          <Typography
            sx={{
              fontSize: "1.2rem",
              fontWeight: "600",
              color: "#FFFFFF",
              "@media (max-width: 2000px)": {
                fontSize: "1.1rem",
              },
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              maxLines: 1,
              maxInlineSize: "100%",
              mt: ["episode"].includes(item.type) ? "2px" : "0px",
            }}
          >
            {item.title}
          </Typography>

          {["episode"].includes(item.type) && item.grandparentTitle && (
            <Typography
              onClick={(e) => {
                e.stopPropagation();
                if (!item.grandparentKey?.toString()) return;
                setSearchParams({
                  mid: (item.grandparentRatingKey as string).toString(),
                });
              }}
              sx={{
                fontSize: "0.9rem",
                fontWeight: "normal",
                color: "#FFFFFF",
                opacity: 0.75,
                mb: 1,
                transition: "opacity 0.4s ease",
                "&:hover": {
                  opacity: 1,
                  textDecoration: "none",
                },
                textOverflow: "ellipsis",
                overflow: "hidden",
                maxLines: 1,
                maxInlineSize: "100%",
              }}
            >
              {item.grandparentTitle}
            </Typography>
          )}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              mt: "4px",
              gap: 1,
            }}
          >
            {/* {item.rating && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                ml: 1,
              }}
            >
              {item.rating}
            </Typography>
          )}
          {item.contentRating && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                ml: 1,
                border: "1px dotted #AAAAAA",
                borderRadius: "5px",
                px: 1,
                py: -0.5,
              }}
            >
              {item.contentRating}
            </Typography>
          )} */}
            {/* {item.type === "episode" && item.index && (
            <Typography
              sx={{
                fontSize: "medium",
                fontWeight: "light",
                color: "#FFFFFF",
                ml: 1,
              }}
            >
              S{item.parentIndex} E{item.index}
            </Typography>
          )} */}
            {item.duration && ["episode", "movie"].includes(item.type) && (
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: "400",
                  color: "#FFFFFF",
                  opacity: 0.7,
                }}
              >
                {durationToText(item.duration)}
              </Typography>
            )}
            {item.type === "show" &&
              item.leafCount &&
              (item.seasonCount ?? item.childCount) && (
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: "400",
                    color: "#FFFFFF",
                    opacity: 0.7,
                  }}
                >
                  {(item.seasonCount ?? item.childCount ?? 1) > 1
                    ? `${item.childCount} Seasons`
                    : `${item.leafCount} Episode${
                        item.leafCount > 1 ? "s" : ""
                      }`}
                </Typography>
              )}

            {item.year && (
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: "400",
                  color: "#FFFFFF",
                  opacity: 0.7,
                }}
              >
                {item.year}
              </Typography>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            width: "100%",
            height: "0px", // 32px
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.4s ease",
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0px 16px",
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              sx={{
                width: "100%",
                height: "100%",
                backgroundColor: (theme) => theme.palette.background.paper,
                color: (theme) => theme.palette.primary.contrastText,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.primary.dark,
                },
                gap: 0.5,
                transition: "all 0.4s ease-in-out",
                padding: "0px 10px",
                fontSize: "13px",
                borderRadius: "6px",
                boxShadow: "none",
              }}
              disabled={playButtonLoading}
              onClick={async (e) => {
                e.stopPropagation();
                await handlePlay();
              }}
            >
              {playButtonLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <>
                  <PlayArrowRounded style={{ fontSize: "18px" }} /> Play
                </>
              )}
            </Button>

            <WatchListButton item={item} />
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default MovieItem;

export function WatchListButton({ item }: { item: Plex.Metadata }) {
  const WatchList = useWatchListCache();
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <Button
      variant="contained"
      sx={{
        width: "48px",
        height: "38px",
        backgroundColor: (theme) => theme.palette.background.paper,
        color: theme => theme.palette.text.primary,
        borderRadius: "6px",
        "&:hover": {
          backgroundColor: (theme) => theme.palette.primary.dark,
        },
        transition: "all 0.4s ease-in-out",
        boxShadow: "none",
        
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!item || isLoading) return;
        setIsLoading(true);

        WatchListCacheEmitter.once("watchListUpdate", () => {
          setIsLoading(false);
        });

        if (WatchList.isOnWatchList(item.guid))
          return WatchList.removeItem(item.guid);

        WatchList.addItem(item);
      }}
    >
      {isLoading ? (
        <CircularProgress size={14} color="inherit" />
      ) : (
        <>
          {WatchList.isOnWatchList(item.guid) ? (
            <BookmarkRounded fontSize="small" />
          ) : (
            <BookmarkBorderRounded fontSize="small" />
          )}
        </>
      )}
    </Button>
  );
}
