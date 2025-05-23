import axios from "axios";
import { queryBuilder } from "./QuickFunctions";

export namespace PlexTv {
    /**
     * Adds a given item to the watchlist.
     *
     * @param {string} ratingKey - The rating key from the guid.
     * @returns {Promise<void>} - A promise that resolves when the item has been successfully added to the watchlist.
     *
     * @throws Will log an error message to the console if the request fails.
     */
    export async function addToWatchlist(ratingKey: string): Promise<void> {
        try {
            await axios.put(`https://discover.provider.plex.tv/actions/addToWatchlist?ratingKey=${ratingKey}`, {}, {
                headers: {
                    "X-Plex-Token": localStorage.getItem("accAccessToken") as string
                }
            })
        } catch (error) {
            console.error("Error adding to watchlist", error);
        }
    }

    export async function removeFromWatchlist(ratingKey: string): Promise<void> {
        try {
            await axios.put(`https://discover.provider.plex.tv/actions/removeFromWatchlist?ratingKey=${ratingKey}`, {}, {
                headers: {
                    "X-Plex-Token": localStorage.getItem("accAccessToken") as string
                }
            })
        } catch (error) {
            console.error("Error removing from watchlist", error);
        }
    }

    export async function getWatchlist(): Promise<Plex.Metadata[]> {
        try {
            const res = await axios.get(`https://discover.provider.plex.tv/library/sections/watchlist/all?${queryBuilder({
                "X-Plex-Token": localStorage.getItem("accAccessToken") as string,
                "includeAdvanced": 1,
                "includeMeta": 1,
                "X-Plex-Container-Start": 0,
                "X-Plex-Container-Size": 300,
            })}`)
            return res.data.MediaContainer.Metadata;
        } catch (error) {
            return [];
        }
    }
}