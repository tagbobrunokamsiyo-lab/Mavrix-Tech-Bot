const yts = require('yt-search');
const axios = require('axios');

// ───── Minimal Music System ─────
console.log(`[ Music Downloader Started ]`);

// Reliable Music APIs (Updated)
const MUSIC_APIS = [
  {
    name: "YouTube DL",
    url: (videoId) => `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
    map: (data) => data?.link ? {
      download: data.link,
      title: data.title,
      duration: data.duration,
      quality: data.quality || '128kbps',
      thumbnail: `https://i.ytimg.com/vi/${data.id || ''}/hqdefault.jpg`
    } : null,
    priority: 1
  },
  {
    name: "YtMp3 API",
    url: (videoId) => `https://yt-api.p.rapidapi.com/dl?id=${videoId}`,
    map: (data) => data?.url ? {
      download: data.url,
      title: data.title,
      duration: data.duration,
      quality: '128kbps',
      thumbnail: data.thumbnail
    } : null,
    priority: 2
  },
  {
    name: "YouTube Audio",
    url: (videoId) => `https://youtube-audio-extractor.p.rapidapi.com/download?video_id=${videoId}`,
    map: (data) => data?.url ? {
      download: data.url,
      title: data.title,
      duration: data.duration,
      quality: data.bitrate || '128kbps',
      thumbnail: data.thumbnail
    } : null,
    priority: 3
  }
];

// ───── Helper Functions ─────
async function fetchAudio(videoId) {
  const errors = [];
  
  for (const api of MUSIC_APIS.sort((a, b) => a.priority - b.priority)) {
    try {
      const response = await axios.get(api.url(videoId), {
        timeout: 15000,
        headers: {
          'X-RapidAPI-Key': 'your_rapidapi_key_here', // You need to get this
          'X-RapidAPI-Host': api.url(videoId).split('/')[2]
        }
      });
      
      const result = api.map(response.data);
      if (result?.download) {
        console.log(`✓ ${api.name} success`);
        return { ...result, source: api.name };
      }
    } catch (err) {
      errors.push(api.name);
      continue;
    }
  }
  
  throw new Error(`All APIs failed. Tried: ${errors.join(', ')}`);
}

// Clean filename function
function cleanFileName(title, author = '') {
  // Remove special characters, keep spaces and basic punctuation
  let cleanName = title.replace(/[<>:"/\\|?*]/g, '');
  if (author) {
    cleanName = `${author} - ${cleanName}`;
  }
  // Limit length for mobile devices
  return cleanName.substring(0, 80) + '.mp3';
}

// ───── Main Command ─────
async function playCommand(sock, chatId, message) {
  try {
    const text = message.message?.conversation || 
                message.message?.extendedTextMessage?.text || '';
    const query = text.split(' ').slice(1).join(' ').trim();

    // Help message
    if (!query) {
      await sock.sendMessage(chatId, { 
        text: `🎵 Music Downloader\n\nUsage: .play <song or url>\nExample: .play Rick Astley Never Gonna Give You Up`
      }, { quoted: message });
      return;
    }

    // Show searching
    await sock.sendMessage(chatId, {
      react: { text: '🔍', key: message.key }
    });

    let videoId, videoInfo;
    
    // Check if it's a URL
    if (query.includes('youtu.be/') || query.includes('youtube.com/watch')) {
      const urlMatch = query.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&?/]+)/);
      videoId = urlMatch ? urlMatch[1] : null;
    }

    // Search if not a URL
    if (!videoId) {
      const searchResults = await yts(query);
      if (!searchResults.videos.length) {
        await sock.sendMessage(chatId, {
          text: `No results found for "${query}"`
        }, { quoted: message });
        return;
      }
      
      videoInfo = searchResults.videos[0];
      videoId = videoInfo.videoId;
      
      // Show track info
      await sock.sendMessage(chatId, {
        image: { url: videoInfo.thumbnail },
        caption: `🎵 ${videoInfo.title}\n👤 ${videoInfo.author?.name || 'Unknown'}\n⏱️ ${videoInfo.timestamp || 'Unknown duration'}`
      });
    } else {
      // Get info for URL
      const search = await yts({ videoId });
      videoInfo = search;
    }

    // Start download
    const processing = await sock.sendMessage(chatId, {
      text: `Downloading audio...`
    });

    // Fetch audio
    const audioData = await fetchAudio(videoId);
    
    // Clean filename with metadata
    const fileName = cleanFileName(
      audioData.title || videoInfo?.title || 'audio',
      videoInfo?.author?.name || ''
    );

    // Delete processing message
    await sock.sendMessage(chatId, { delete: processing.key });

    // Send audio with proper metadata
    await sock.sendMessage(chatId, {
      audio: { url: audioData.download },
      mimetype: 'audio/mpeg',
      fileName: fileName,
      ptt: false
    }, { quoted: message });

    // Success message
    await sock.sendMessage(chatId, {
      text: `✅ Downloaded\n${fileName}\nQuality: ${audioData.quality}`
    });

  } catch (error) {
    console.error('Error:', error);
    
    let errorMsg = `Error: ${error.message}`;
    if (error.message.includes('All APIs failed')) {
      errorMsg = 'Service temporarily unavailable. Please try again later.';
    }
    
    await sock.sendMessage(chatId, {
      text: errorMsg
    }, { quoted: message });
  }
}

module.exports = { playCommand };
