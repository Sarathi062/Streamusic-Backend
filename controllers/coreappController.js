require("dotenv").config();

const spotifyUrl = process.env.SPOTIFY;
const clientId = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;
const YoutubeKeys = process.env.YOUTUBEKEY.split(",");
const axios = require("axios");
const { json } = require("express");

const AccessToken = async (req, res) => {
  try {
    const response = await fetch(spotifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    const data = await response.json();
    if (data.access_token) {
      const expiresAt = Date.now() + data.expires_in * 1000;
      const accessToken = data.access_token;

      //   document.cookie = `spotify_access_token=${accessToken}; path=/; max-age=${data.expires_in}; Secure; SameSite=None`;
      //   document.cookie = `spotifyAppExpiresAt=${expiresAt}; path=/; max-age=${data.expires_in}; Secure; SameSite=None`;

      res.cookie("spotify_access_token", "true", {
        path: "/",
        maxAge: data.expires_in, // 6 hours in milliseconds
        secure: false, // send cookie only over HTTPS
        sameSite: "None", // allow cross-site cookie
        httpOnly: true, // accessible by JavaScript on client side
      });

      res.cookie("spotifyAppExpiresAt", `${expiresAt}`, {
        path: "/",
        maxAge: data.expires_in, // 6 hours in milliseconds
        secure: false, // send cookie only over HTTPS
        sameSite: "None", // allow cross-site cookie
        httpOnly: true, // accessible by JavaScript on client side
      });

      // Save to Redux
      dispatch(setToken({ accessToken: accessToken, expiresAt }));
    } else {
      console.error("Failed to get access token:", data);
    }
  } catch (error) {}
};

const RefreshToken = async (req, res) => {
  const spotifyRefreshToken = req.cookies.spotifyRefreshToken;
  const spotifyExpiresAt = parseInt(req.cookies.spotifyExpiresAt, 10);
  const spotifyAccessToken = req.cookies.spotifyAccessToken;

  if (!spotifyRefreshToken || spotifyRefreshToken === "null") return;

  if (
    Date.now() >= spotifyExpiresAt ||
    !spotifyAccessToken ||
    spotifyAccessToken === "null"
  ) {
    if (!spotifyRefreshToken) return;
    try {
      const response = await fetch(spotifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: spotifyRefreshToken,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        const expiresInMs = Date.now() + data.expires_in * 1000;

        dispatch(setAuth({ userauth: true, UaccessToken: data.access_token }));

        // document.cookie = `LogedIn=true; path=/;max-age=${data.expires_in} Secure; SameSite=None`;
        // document.cookie = `spotifyAccessToken=${data.access_token}; path=/; max-age=${data.expires_in};Secure; SameSite=None`;
        // document.cookie = `spotifyExpiresAt=${expiresInMs}; max-age=${data.expires_in} path=/; Secure; SameSite=None`;

        res.cookie("LogedIn", "true", {
          path: "/",
          maxAge: data.expires_in, // 6 hours in milliseconds
          secure: false, // send cookie only over HTTPS
          sameSite: "None", // allow cross-site cookie
          httpOnly: true, // accessible by JavaScript on client side
        });

        res.cookie("spotifyAccessToken", `${data.access_token}`, {
          path: "/",
          maxAge: data.expires_in, // 6 hours in milliseconds
          secure: false, // send cookie only over HTTPS
          sameSite: "None", // allow cross-site cookie
          httpOnly: true, // accessible by JavaScript on client side
        });

        res.cookie("spotifyAppExpiresAt", `${expiresInMs}`, {
          path: "/",
          maxAge: data.expires_in, // 6 hours in milliseconds
          secure: false, // send cookie only over HTTPS
          sameSite: "None", // allow cross-site cookie
          httpOnly: true, // accessible by JavaScript on client side
        });
      }
    } catch (error) {
      console.error("Error refreshing access token:", error);
    }
  }
};

const TrendingSongsPoster = async (req, res) => {
  for (let i = 0; i < YoutubeKeys.length; i++) {
    try {
      const response = await axios.get(
        `${process.env.YOUTUBE}&key=${YoutubeKeys[i]}`
      );
      // console.log(typeof response); // js object
      if (response.status === 200 && response.data) {
        const items = response.data.items;

        const Posters = items.map((item) => ({
          id: item.id,
          thumbnailUrl:
            item.snippet.thumbnails?.maxres?.url ||
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.medium?.url,
        }));
        return res.json(Posters);
      }
    } catch (error) {
      console.warn(error.response?.status || error.message);
    }
  }

  throw new Error("No valid API key found");
};

const convertYouTubeDurationToMS = (duration) => {
  const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  const minutes = parseInt(match?.[1] || 0);
  const seconds = parseInt(match?.[2] || 0);
  return (minutes * 60 + seconds) * 1000;
};

const TrendingSongs = async (req, res) => {
  const apiKeys = process.env.YOUTUBEKEY?.split(","); // comma-separated in .env

  if (!apiKeys || apiKeys.length === 0) {
    return res.status(500).json({ error: "No API keys available." });
  }

  for (let i = 0; i < apiKeys.length; i++) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&regionCode=IN&videoCategoryId=10&key=${apiKeys[i]}&maxResults=10`;

    try {
      const response = await axios.get(url);

      if (response.status === 200 && response.data.items) {
        const trending = response.data.items.map((item) => ({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.default.url,
          channelTitle: item.snippet.channelTitle,
          duration: convertYouTubeDurationToMS(item.contentDetails.duration),
        }));

        return res.status(200).json({ trending });
      }
    } catch (err) {
      console.error(
        `Key ${apiKeys[i]} failed:`,
        err.response?.data?.error || err.message
      );
    }
  }

  return res
    .status(500)
    .json({ error: "All API keys failed or quota exceeded." });
};

const SearchSongs = async (req, res) => {
  const { query } = req.query;
  const apiKeys = process.env.YOUTUBEKEY?.split(",");

  if (!apiKeys || apiKeys.length === 0) {
    return res.status(500).json({ error: "No API keys available." });
  }

  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Search query is required." });
  }

  // Bias the query to return song-like content
  const modifiedQuery = `${query} song`;

  for (let i = 0; i < apiKeys.length; i++) {
    const url = `${process.env.YOUTUBE_SEARCH}${encodeURIComponent(
      modifiedQuery
    )}&type=video&videoCategoryId=10&key=${apiKeys[i]}&regionCode=IN`;

    try {
      const response = await axios.get(url);

      if (response.status === 200 && response.data.items) {
        const searchResults = response.data.items.map((item) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.default.url,
          channelTitle: item.snippet.channelTitle,
        }));

        return res.status(200).json({ searchResults });
      }
    } catch (err) {
      console.error(
        `Key ${apiKeys[i]} failed:`,
        err.response?.data?.error || err.message
      );
    }
  }

  return res
    .status(500)
    .json({ error: "All API keys failed or quota exceeded." });
};

module.exports = {
  AccessToken,
  RefreshToken,
  TrendingSongsPoster,
  TrendingSongs,
  SearchSongs,
};
