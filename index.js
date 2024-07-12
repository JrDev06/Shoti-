const axios = require('axios');

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

  async streamVideo(videoPath) {
    const server = require('http-server');
    const port = 3000;
    server.createServer({
      root: './videos',
    }).listen(port, () => {
      console.log(`Video streaming at http://localhost:${port}/${videoPath}`);
    });
  }
}

const api = new TikTokAPI();

// Search for videos
const query = 'shoti or beautiful Filipina girl';
const videoLinks = await api.searchVideos(query);

// Get video info and download the first video
const videoUrl = videoLinks[0];
const videoInfo = await api.getVideoInfo(videoUrl);
const videoPath = await api.downloadVideo(videoUrl);

// Stream the video
await api.streamVideo(videoPath);
