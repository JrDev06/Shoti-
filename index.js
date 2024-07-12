// index.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3030;
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const httpServer = require("http-server");
const path = require("path");

class TikTokAPI {
  async searchVideos(query) {
    const response = await axios.get(`https://tiktok.com/search?q=${query}`);
    const videoLinks = [];
    const $ = cheerio.load(response.data);
    $('a[href*="/video/"]').each((index, element) => {
      videoLinks.push(`https://tiktok.com${$(element).attr('href')}`);
    });
    return videoLinks;
  }

  async getVideoInfo(videoUrl) {
    const response = await axios.get(videoUrl);
    const $ = cheerio.load(response.data);
    const videoId = $('meta[property="og:video:url"]').attr('content').split('/').pop();
    const title = $('meta[property="og:title"]').attr('content');
    const coverImageUrl = $('meta[property="og:image"]').attr('content');
    const videoDescription = $('meta[property="og:description"]').attr('content');
    const duration = parseInt($('meta[property="og:video:duration"]').attr('content'));
    const height = parseInt($('meta[property="og:video:height"]').attr('content'));
    const width = parseInt($('meta[property="og:video:width"]').attr('content'));
    return {
      id: videoId,
      title,
      coverImageUrl,
      videoDescription,
      duration,
      height,
      width,
    };
  }

  async downloadVideo(videoUrl) {
    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
    });
    const videoBuffer = response.data;
    const videoPath = `videos/${videoUrl.split('/').pop()}.mp4`;
    fs.writeFileSync(videoPath, videoBuffer);
    return videoPath;
  }

  async streamVideo(videoUrl, res) {
    const videoPath = await this.downloadVideo(videoUrl);
    const filePath = path.join(__dirname, videoPath);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  }
}

const api = new TikTokAPI();

app.get("/shoti/:id", async (req, res) => {
  const videoUrl = `https://tiktok.com/video/${req.params.id}`;
  await api.streamVideo(videoUrl, res);
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
