const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/shoti', async (req, res) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Navigate to TikTok search page with specific criteria
        await page.goto('https://tiktok.com/tag/beautiful-girls-philippines', { waitUntil: 'networkidle2' });

        // Scrape video URLs from the search results
        const videoUrls = await page.evaluate(() => {
            const videos = Array.from(document.querySelectorAll('a[href*="/video/"]'));
            return videos.map(video => video.href);
        });

        if (videoUrls.length === 0) {
            throw new Error('No videos found');
        }

        const randomVideoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];
        await page.goto(randomVideoUrl, { waitUntil: 'networkidle2' });

        // Scrape the direct video URL
        const videoSrc = await page.evaluate(() => {
            const video = document.querySelector('video');
            return video ? video.src : null;
        });

        if (!videoSrc) {
            throw new Error('Video URL not found');
        }

        // Fetch the video stream and pipe it to the response
        const videoResponse = await axios({
            url: videoSrc,
            method: 'GET',
            responseType: 'stream'
        });

        res.setHeader('Content-Type', 'video/mp4');
        videoResponse.data.pipe(res);
    } catch (error) {
        console.error('Error fetching video:', error.message);
        res.status(500).json({ error: 'Failed to fetch video' });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
