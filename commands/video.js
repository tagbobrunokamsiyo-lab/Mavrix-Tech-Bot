// [file name]: video.js
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

// 🎯 Production-Grade Multi-API Configuration for YouTube
const YT_APIS = [
  {
    name: "Ryzendesu",
    url: (videoUrl) => `https://api.ryzendesu.com/api/ytmp4?url=${encodeURIComponent(videoUrl)}`,
    map: (data) => {
      if (data?.result?.download) {
        return {
          download: data.result.download,
          title: data.result.title || 'YouTube Video',
          duration: data.result.duration,
          quality: data.result.quality || '720p',
          size: data.result.size,
          type: 'youtube',
          format: 'mp4'
        };
      }
      return null;
    }
  },
  {
    name: "Okatsu", 
    url: (videoUrl) => `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(videoUrl)}`,
    map: (data) => {
      if (data?.result?.mp4) {
        return {
          download: data.result.mp4,
          title: data.result.title || 'YouTube Video',
          duration: data.result.duration,
          quality: '720p',
          size: data.result.size,
          type: 'youtube',
          format: 'mp4'
        };
      }
      return null;
    }
  }
];

// 🌍 GLOBAL MOVIE APIS Configuration with MKV/MP4 Support
const MOVIE_APIS = [
  // 🌏 ASIA
  {
    name: "Bollywood-API",
    url: (query) => `https://bollywood-api.mavrix.workers.dev/search?title=${encodeURIComponent(query)}`,
    map: (data) => {
      if (data?.movie) {
        const movie = data.movie;
        return {
          download: movie.download_link,
          title: movie.title,
          duration: 'Full Movie',
          quality: movie.quality || '720p',
          size: movie.size || '150MB',
          type: 'movie',
          genre: 'Bollywood',
          year: movie.year,
          language: movie.language || 'Hindi',
          region: 'India',
          format: movie.format || 'mp4',
          thumbnail: movie.poster
        };
      }
      return null;
    }
  },
  {
    name: "NKiri-Proxy",
    url: (query) => `https://nkiri-proxy.cyclic.app/search?q=${encodeURIComponent(query)}`,
    map: (data) => {
      if (data?.results && data.results.length > 0) {
        const movie = data.results[0];
        // NKiri typically provides MKV files around 100-150MB
        return {
          download: movie.downloadUrl,
          title: movie.title,
          duration: 'Full Movie',
          quality: movie.quality || '720p',
          size: movie.size || '120MB',
          type: 'movie',
          genre: movie.category || 'Drama',
          year: movie.year,
          region: 'Nigeria',
          format: 'mkv', // NKiri uses MKV format
          language: 'English',
          thumbnail: movie.image
        };
      }
      return null;
    }
  },
  {
    name: "KimoiTV-Proxy",
    url: (query) => `https://kimoi-proxy.vercel.app/search?drama=${encodeURIComponent(query)}`,
    map: (data) => {
      if (data?.episodes && data.episodes.length > 0) {
        const episode = data.episodes[0];
        // KimoiTV provides MKV drama files
        return {
          download: episode.download_link,
          title: episode.title,
          duration: 'Episode',
          quality: episode.quality || '720p',
          size: episode.size || '130MB',
          type: 'drama',
          genre: 'Asian Drama',
          region: 'Various',
          format: 'mkv', // KimoiTV uses MKV
          episode: episode.episode_number,
          thumbnail: episode.thumbnail
        };
      }
      return null;
    }
  },
  {
    name: "NaijaPrey-Proxy",
    url: (query) => `https://naijaprey-proxy.cyclic.app/search?movie=${encodeURIComponent(query)}`,
    map: (data) => {
      if (data?.movies && data.movies.length > 0) {
        const movie = data.movies[0];
        // NaijaPrey provides larger MP4 files (like the 371MB example)
        return {
          download: movie.download_url,
          title: movie.title,
          duration: 'Full Movie',
          quality: movie.quality || '720p',
          size: movie.size || '200MB',
          type: 'movie',
          genre: movie.genre || 'Action',
          year: movie.year,
          region: 'Nigeria',
          format: 'mp4', // NaijaPrey uses MP4
          language: 'English',
          thumbnail: movie.poster
        };
      }
      return null;
    }
  },
  {
    name: "Fzmovies-Proxy",
    url: (query) => `https://fzmovies-proxy.vercel.app/api/search?movie=${encodeURIComponent(query)}`,
    map: (data) => {
      if (data?.success && data.movies && data.movies.length > 0) {
        const movie = data.movies[0];
        return {
          download: movie.download_link,
          title: movie.title,
          duration: 'Full Movie',
          quality: movie.quality || '720p',
          size: movie.size || '180MB',
          type: 'movie',
          genre: movie.genre,
          year: movie.year,
          region: 'Global',
          format: movie.format || 'mp4',
          thumbnail: movie.poster
        };
      }
      return null;
    }
  },
  // 🌍 More regional APIs...
  {
    name: "GlobalMovies-API",
    url: (query) => `https://global-movies-api.mavrix.workers.dev/search?q=${encodeURIComponent(query)}`,
    map: (data) => {
      if (data?.results && data.results.length > 0) {
        const movie = data.results[0];
        return {
          download: movie.download_url,
          title: movie.title,
          duration: 'Full Movie',
          quality: movie.quality || '720p',
          size: movie.size || '150MB',
          type: 'movie',
          genre: movie.genre,
          year: movie.year,
          region: movie.region || 'Global',
          format: movie.format || 'mp4',
          language: movie.language,
          thumbnail: movie.thumbnail
        };
      }
      return null;
    }
  }
];

// ⚙️ Enhanced Production Configuration for Large Files
const CONFIG = {
  timeout: 180000, // 3 minutes for large movie files
  maxRetries: 3,
  retryDelay: 1000,
  maxVideoSize: 400 * 1024 * 1024, // 400MB
  maxVideoDuration: 7200, // 2 hours
  supportedFormats: ['mp4', 'mkv', 'avi', 'mov', 'wmv'],
  movieKeywords: [
    'movie', 'film', 'cinema', 'pelicula', 'filme', 'cine',
    'drama', 'series', 'episode', 'season', 's01', 's02',
    'mkv', 'mp4', 'avi', 'download',
    'bollywood', 'nollywood', 'korean', 'asian drama',
    'genie', 'make a wish', 'khemjira', 'kimoi', 'nkiri', 'naijaprey'
  ]
};

// 🛡️ Enhanced HTTP Client for Large Files
// Note: Do NOT set global responseType here - different endpoints expect json vs streaming.
const httpClient = axios.create({
  timeout: CONFIG.timeout,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*',
    'Accept-Range': 'bytes'
  },
  maxContentLength: 500 * 1024 * 1024,
  maxBodyLength: 500 * 1024 * 1024
});

// 📁 File Format Handler
function getMimeType(format) {
  const mimeTypes = {
    'mp4': 'video/mp4',
    'mkv': 'video/x-matroska',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv'
  };
  return mimeTypes[format] || 'video/mp4';
}

function getFileExtension(format) {
  return format || 'mp4';
}

// 🎯 Smart Query Classifier - Enhanced for Drama/Series
function classifyQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  const isDramaSeries = /(s\d+e\d+|season\s*\d+\s*episode\s*\d+|ep\s*\d+)/i.test(query) ||
                       lowerQuery.includes('drama') ||
                       lowerQuery.includes('series') ||
                       lowerQuery.includes('episode');
  
  const requestedFormat = lowerQuery.includes('mkv') ? 'mkv' : 
                         lowerQuery.includes('mp4') ? 'mp4' : null;

  const isMovieRequest = CONFIG.movieKeywords.some(keyword => 
    lowerQuery.includes(keyword)
  ) || isDramaSeries;

  return {
    isMovie: isMovieRequest,
    isYouTube: !isMovieRequest || lowerQuery.includes('youtube') || lowerQuery.includes('yt'),
    isDrama: isDramaSeries,
    requestedFormat: requestedFormat,
    query: query
  };
}

// 📊 Enhanced Format Helpers
function formatDuration(seconds) {
  if (!seconds) return 'Unknown';
  if (seconds === 'Full Movie' || seconds === 'Episode') return seconds;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  
  if (typeof bytes === 'string') {
    return bytes;
  }
  
  const mb = bytes / (1024 * 1024);
  if (mb > 1024) {
    return (mb / 1024).toFixed(1) + ' GB';
  }
  return Math.round(mb) + ' MB';
}

// 🎨 Enhanced Message Templates for MKV/MP4
function createThumbnailCaption(videoInfo, searchQuery, isMovie = false, isDrama = false) {
  const title = videoInfo.title || searchQuery;
  const duration = formatDuration(videoInfo.duration);
  const format = videoInfo.format ? videoInfo.format.toUpperCase() : 'MP4';
  
  if (isDrama) {
    return `🎭 *${title}*

📺 Drama Details:
⏱️ Duration: ${duration}
📁 Format: ${format}
🎭 Type: ${videoInfo.genre || 'Drama Series'}
📚 Episode: ${videoInfo.episode || 'Latest'}
🌍 Region: ${videoInfo.region || 'Various'}

⬇️ Preparing drama download...
🔄 This may take 2-5 minutes...`;
  }
  
  if (isMovie) {
    return `🎬 *${title}*

📊 Movie Details:
⏱️ Duration: ${duration}
📁 Format: ${format}
🎭 Genre: ${videoInfo.genre || 'Various'}
🌍 Region: ${videoInfo.region || 'Global'}
⭐ Rating: ${videoInfo.rating || 'Not rated'}

⬇️ Preparing movie download...
🔄 This may take 2-5 minutes...`;
  }
  
  return `🎬 *${title}*

📊 Metadata:
⏱️ Duration: ${duration}
📁 Format: ${format}
👀 ${videoInfo.views ? `${videoInfo.views.toLocaleString()} views` : ''}

⬇️ Downloading your video...
🔄 Please wait...`;
}

function createSuccessCaption(videoData, originalTitle) {
  const title = videoData.title || originalTitle;
  const duration = formatDuration(videoData.duration);
  const size = formatFileSize(videoData.size);
  const quality = videoData.quality || 'HD';
  const format = videoData.format ? videoData.format.toUpperCase() : 'MP4';
  
  if (videoData.type === 'drama') {
    return `✅ *Drama Download Successful!* 🎭

📺 *${title}*

📊 Drama Details:
🎯 Quality: ${quality}
📁 Format: ${format}
⏱️ Duration: ${duration}
📦 Size: ${size}
🎭 Genre: ${videoData.genre || 'Drama'}
📚 Episode: ${videoData.episode || 'Latest'}
🌍 Region: ${videoData.region || 'Various'}

🔧 Source: ${videoData.source}

✨ *Enjoy your drama!* 📺`;
  }
  
  if (videoData.type === 'movie') {
    return `✅ *Movie Download Successful!* 🎬

🎬 *${title}*

📊 Movie Details:
🎯 Quality: ${quality}
📁 Format: ${format}
⏱️ Duration: ${duration}
📦 Size: ${size}
🎭 Genre: ${videoData.genre || 'Various'}
🌍 Region: ${videoData.region || 'Global'}

🔧 Source: ${videoData.source}

✨ *Enjoy your movie!* 🍿`;
  }
  
  return `✅ *Download Successful!*

📹 *${title}*

📊 Details:
🎯 Quality: ${quality}
📁 Format: ${format}
⏱️ Duration: ${duration}
📦 Size: ${size}
🔧 Source: ${videoData.source}

✨ *Enjoy your video!*`;
}

// 🔄 Smart Retry System with Jitter that supports json/stream responses
async function smartFetch(url, retries = CONFIG.maxRetries, opts = { responseType: 'json' }) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🌐 Fetch attempt ${attempt}/${retries} -> ${url} (responseType=${opts.responseType})`);
      const response = await httpClient.get(url, { responseType: opts.responseType === 'stream' ? 'stream' : 'json' });
      // For json responseType, return parsed data; for stream, return the whole response
      if ((opts.responseType === 'json' && response.status === 200 && response.data) ||
          (opts.responseType === 'stream' && response.status === 200)) {
        return opts.responseType === 'json' ? response.data : response;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt} failed for ${url}:`, error.message);
      if (attempt < retries) {
        const delay = CONFIG.retryDelay * attempt + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(`Failed after ${retries} attempts: ${url}`);
}

// 🚀 Multi-API Fallback for Movies with Format Preference
async function fetchFromMovieAPIs(searchQuery, preferredFormat = null) {
  const errors = [];
  
  // Try format-specific APIs first if format is preferred
  if (preferredFormat) {
    const formatAPIs = MOVIE_APIS.filter(api => {
      try {
        const sample = api.map({});
        return sample?.format === preferredFormat;
      } catch (e) {
        return false;
      }
    });
    
    for (const api of formatAPIs) {
      try {
        console.log(`🔄 Trying ${api.name} for ${preferredFormat.toUpperCase()}...`);
        const data = await smartFetch(api.url(searchQuery), CONFIG.maxRetries, { responseType: 'json' });
        const result = api.map(data);
        
        if (result && result.download) {
          console.log(`✅ ${api.name} success with ${preferredFormat.toUpperCase()}!`);
          return {
            ...result,
            source: api.name
          };
        }
      } catch (error) {
        console.warn(`❌ ${api.name} failed:`, error.message);
        errors.push(api.name);
      }
    }
  }
  
  // Fallback to all APIs
  for (const api of MOVIE_APIS) {
    try {
      console.log(`🔄 Trying ${api.name}...`);
      const data = await smartFetch(api.url(searchQuery), CONFIG.maxRetries, { responseType: 'json' });
      const result = api.map(data);
      
      if (result && result.download) {
        console.log(`✅ ${api.name} success!`);
        return {
          ...result,
          source: api.name
        };
      }
    } catch (error) {
      console.warn(`❌ ${api.name} failed:`, error.message);
      errors.push(api.name);
      continue;
    }
  }
  
  throw new Error(`No movies/dramas found for "${searchQuery}". Try different title or check spelling.`);
}

// 📏 Enhanced Video Size Validator for Large Files
async function validateVideoSize(videoUrl) {
  try {
    // Use HEAD to fetch Content-Length and Content-Type
    const response = await httpClient.head(videoUrl, { timeout: 10000 });
    const contentLength = response.headers['content-length'];
    const contentType = response.headers['content-type'] || '';
    
    if (contentLength && parseInt(contentLength) > CONFIG.maxVideoSize) {
      return {
        valid: false,
        size: parseInt(contentLength),
        message: `❌ File too large (${formatFileSize(contentLength)}). Maximum allowed: ${formatFileSize(CONFIG.maxVideoSize)}.`
      };
    }
    
    const isVideo = contentType.includes('video/') || 
                   videoUrl.includes('.mkv') || 
                   videoUrl.includes('.mp4') ||
                   videoUrl.includes('.avi');
    
    if (!isVideo) {
      return {
        valid: false,
        size: parseInt(contentLength),
        message: '❌ Unsupported file format. Please try a different source.'
      };
    }
    
    return { 
      valid: true, 
      size: contentLength ? parseInt(contentLength) : null,
      format: videoUrl.includes('.mkv') ? 'mkv' : 
              videoUrl.includes('.mp4') ? 'mp4' : null
    };
  } catch (error) {
    console.warn('Size validation failed, proceeding anyway:', error.message);
    // If HEAD fails, allow attempt but warn downstream
    return { valid: true, size: null, format: null };
  }
}

// 🎵 ENHANCED .ytmp4 COMMAND with MKV/MP4 Support
async function videoCommand(sock, chatId, message) {
  try {
    // ✅ Extract text safely
    let text = '';
    if (message.message?.conversation) {
      text = message.message.conversation;
    } else if (message.message?.extendedTextMessage?.text) {
      text = message.message.extendedTextMessage.text;
    } else if (message.message?.imageMessage?.caption) {
      text = message.message.imageMessage.caption;
    }
    
    if (!text || !text.startsWith('.ytmp4')) return;
    
    const args = text.split(' ').slice(1);
    const searchQuery = args.join(' ').trim();

    // 🚫 Enhanced usage guide
    if (!searchQuery) {
      await sock.sendMessage(chatId, {
        text: `🎬 *Global Video & Movie Downloader* 📁

*Now with MKV/MP4 Support!* 🚀

❌ *Usage:* .ytmp4 [movie/drama title or YouTube URL]

*Examples:*
• .ytmp4 Genie Make a Wish S01E10
• .ytmp4 Khemjira S01E05
• .ytmp4 EK Tha Tiger 2012
• .ytmp4 Bollywood romance movie
• .ytmp4 Nollywood drama mkv
• .ytmp4 Korean series episode

*Supported Formats:* MP4, MKV, AVI
*Max File Size:* ${formatFileSize(CONFIG.maxVideoSize)}
*Sources:* NKiri, KimoiTV, NaijaPrey, Fzmovies, Bollywood

✨ *Enjoy cinema-quality downloads!* 🍿`
      }, { quoted: message });
      return;
    }

    // 🎯 Enhanced Query Classification
    const queryType = classifyQuery(searchQuery);
    console.log(`🔍 Query classification:`, queryType);

    let videoUrl = '';
    let videoInfo = {};
    let isUrl = searchQuery.startsWith('http');
    let isMovieSearch = queryType.isMovie && !isUrl;
    let isDramaSearch = queryType.isDrama;

    // 🔍 Enhanced Content Search
    if (isUrl) {
      videoUrl = searchQuery;
      
      if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
        await sock.sendMessage(chatId, {
          text: '❌ *Invalid YouTube URL*\n\nPlease provide a valid YouTube video link.'
        }, { quoted: message });
        return;
      }
    } else if (isMovieSearch || isDramaSearch) {
      // Enhanced movie/drama search flow
      const searchType = isDramaSearch ? 'Drama Series' : 'Movies';
      await sock.sendMessage(chatId, {
        text: `🎬 *Searching ${searchType}:* "${searchQuery}"\n📡 Scanning specialized databases...\n📁 Looking for MKV/MP4 files...`
      }, { quoted: message });

      try {
        // Fetch movie/drama data with format preference
        const mediaData = await fetchFromMovieAPIs(searchQuery, queryType.requestedFormat);
        
        if (!mediaData) {
          await sock.sendMessage(chatId, {
            text: `❌ No ${isDramaSearch ? 'dramas' : 'movies'} found for "${searchQuery}"\n\n💡 Try:\n• Different title\n• Check spelling\n• Remove special characters\n• Try YouTube for trailers`
          }, { quoted: message });
          return;
        }

        videoInfo = {
          title: mediaData.title,
          duration: mediaData.duration,
          thumbnail: mediaData.thumbnail,
          genre: mediaData.genre,
          year: mediaData.year,
          rating: mediaData.rating,
          region: mediaData.region,
          language: mediaData.language,
          format: mediaData.format,
          episode: mediaData.episode,
          quality: mediaData.quality
        };

        videoUrl = mediaData.download;
        
        console.log(`🎯 Selected ${isDramaSearch ? 'Drama' : 'Movie'}: ${videoInfo.title} (${videoInfo.format} - ${mediaData.size || 'unknown size'})`);
        
      } catch (searchError) {
        console.error('Media search error:', searchError);
        await sock.sendMessage(chatId, {
          text: `❌ ${isDramaSearch ? 'Drama' : 'Movie'} search failed for "${searchQuery}"\n\nError: ${searchError.message}\n\n🔄 Falling back to YouTube search...`
        });
        
        // Fallback to YouTube
        isMovieSearch = false;
        isDramaSearch = false;
      }
    }

    // If not a movie/drama search, use YouTube
    if (!isMovieSearch && !isDramaSearch && !isUrl) {
      await sock.sendMessage(chatId, {
        text: `🔍 *Searching YouTube:* "${searchQuery}"\n📡 Finding the best video match...`
      }, { quoted: message });

      try {
        const searchResults = await yts(searchQuery);
        
        if (!searchResults.videos || searchResults.videos.length === 0) {
          await sock.sendMessage(chatId, {
            text: `❌ No videos found for "${searchQuery}"\n\n💡 Try:\n• Movie/drama titles\n• Add "mkv" or "mp4" to search\n• YouTube URL directly`
          }, { quoted: message });
          return;
        }

        videoInfo = searchResults.videos[0]; // Take first result for YouTube
        videoUrl = videoInfo.url;
        videoInfo.format = 'mp4'; // YouTube provides MP4
        
        console.log(`🎯 Selected YouTube: ${videoInfo.title} (${formatDuration(videoInfo.duration)})`);
        
      } catch (searchError) {
        await sock.sendMessage(chatId, {
          text: `❌ Search failed for "${searchQuery}"\n\nError: ${searchError.message}`
        }, { quoted: message });
        return;
      }
    }
    // 📸 Send thumbnail
    if (videoInfo.thumbnail && (videoInfo.thumbnail.startsWith('https') || (isMovieSearch && videoInfo.thumbnail))) {
      try {
        await sock.sendMessage(chatId, {
          image: { url: videoInfo.thumbnail },
          caption: createThumbnailCaption(videoInfo, searchQuery, isMovieSearch, isDramaSearch)
        });
      } catch (thumbError) {
        console.warn('📸 Thumbnail skipped:', thumbError.message);
      }
    }

    // ⏳ Enhanced download progress
    let downloadMessage = '';
    if (isDramaSearch) {
      downloadMessage = `🔄 *Downloading Drama...* 🎭\n\n📥 Connecting to drama servers...\n⏳ This may take 2-5 minutes\n📁 Format: ${videoInfo.format?.toUpperCase() || 'MKV'}\n💾 Size: ${videoInfo.size || '100-150MB'}\n🎯 Quality: ${videoInfo.quality || 'HD'}`;
    } else if (isMovieSearch) {
      downloadMessage = `🔄 *Downloading Movie...* 🎬\n\n📥 Connecting to movie servers...\n⏳ This may take 2-5 minutes\n📁 Format: ${videoInfo.format?.toUpperCase() || 'MP4'}\n💾 Size: ${videoInfo.size || '150-400MB'}\n🎯 Quality: ${videoInfo.quality || 'HD'}`;
    } else {
      downloadMessage = `🔄 *Downloading Video...*\n\n📥 Connecting to servers...\n⏳ This may take 30-60 seconds\n🎯 Quality: 720p HD`;
    }
    
    await sock.sendMessage(chatId, { text: downloadMessage });

    // 🎬 Download content
    let videoData;
    try {
      if (isMovieSearch || isDramaSearch) {
        // We already performed a search earlier, but call again to ensure we have a fresh download URL
        videoData = await fetchFromMovieAPIs(searchQuery, queryType.requestedFormat);
      } else {
        videoData = await fetchFromYouTubeAPIs(videoUrl);
      }
      
      if (!videoData || !videoData.download) {
        throw new Error('No downloadable URL returned by source API.');
      }

      const sizeCheck = await validateVideoSize(videoData.download);
      if (!sizeCheck.valid) {
        await sock.sendMessage(chatId, { 
          text: sizeCheck.message + '\n\n💡 Try searching for a shorter version or different source.' 
        }, { quoted: message });
        return;
      }
      
    } catch (downloadError) {
      console.error('🎬 Download error:', downloadError);
      
      const errorMessage = isDramaSearch ? 
        `❌ *Drama Download Failed!* 🎭\n\nError: ${downloadError.message}\n\n💡 Please try:\n• Different drama title\n• Check episode number\n• Try different source` :
        isMovieSearch ?
        `❌ *Movie Download Failed!* 🎬\n\nError: ${downloadError.message}\n\n💡 Please try:\n• Different movie title\n• Specify year\n• Try YouTube for trailer` :
        `❌ *Download Failed!*\n\nError: ${downloadError.message}\n\n💡 Please try:\n• Different video\n• Try again later\n• Shorter video`;
      
      await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
      return;
    }

    // 🎉 ENHANCED: Send the video with proper format handling
    const fileExtension = getFileExtension(videoData.format);
    const mimeType = getMimeType(videoData.format);
    
    await sock.sendMessage(chatId, {
      video: { 
        url: videoData.download 
      },
      mimetype: mimeType,
      fileName: `${(videoData.title || videoInfo.title || 'video').replace(/[^\w\s.]/gi, '')}.${fileExtension}`.substring(0, 100),
      caption: createSuccessCaption(videoData, videoInfo.title)
    });

    console.log(`✅ ${isDramaSearch ? 'Drama' : isMovieSearch ? 'Movie' : 'Video'} sent successfully: ${videoData.title} (${fileExtension})`);

    // 🌍 Send format guide
    setTimeout(async () => {
      try {
        await sock.sendMessage(chatId, {
          text: `📁 *File Format Guide* 🎬

*Supported Formats:*
• **MKV** - High quality drama/movies (100-150MB)
• **MP4** - Universal format (up to 400MB)
• **AVI** - Legacy format support

*Popular Sources:*
• NKiri.com - African movies/dramas
• KimoiTV.com - Asian dramas  
• NaijaPrey.com - Nigerian movies
• Fzmovies.net - Global cinema

*Pro Tip:* Add "mkv" to your search for drama episodes!
✨ *Enjoy your entertainment!* 📺`
        });
      } catch (e) {
        console.warn('Failed to send format guide:', e.message);
      }
    }, 3000);

  } catch (error) {
    console.error('💥 Command Error:', error);
    
    let errorMessage = '❌ *Unexpected Error!*\n\n';
    
    if (error.message.includes('timeout')) {
      errorMessage += '⏱️ request timeout\n\n';
      errorMessage += '💡 Try again later - large files take time';
    } else if (error.message.includes('size')) {
      errorMessage += '📦 File too large\n\n';
      errorMessage += '💡 Try shorter version or different source';
    } else if (error.message.includes('format')) {
      errorMessage += '📁 Unsupported format\n\n';
      errorMessage += '💡 Try different movie/drama title';
    } else {
      errorMessage += '🔧 Service temporarily unavailable\n\n';
      errorMessage += '💡 Please try again in a few minutes';
    }
    
    try {
      await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
    } catch (sendErr) {
      console.warn('Failed to send final error message:', sendErr.message);
    }
  }
}

// 🚀 Multi-API Fallback for YouTube (keeps existing implementation)
// Note: ensure smartFetch calls use json responseType so mapping sees objects.
async function fetchFromYouTubeAPIs(videoUrl) {
  const errors = [];
  
  for (const api of YT_APIS) {
    try {
      console.log(`🔄 Trying ${api.name} API...`);
      const data = await smartFetch(api.url(videoUrl), CONFIG.maxRetries, { responseType: 'json' });
      const result = api.map(data);
      
      if (result && result.download) {
        console.log(`✅ ${api.name} success!`);
        return {
          ...result,
          source: api.name
        };
      }
    } catch (error) {
      console.warn(`❌ ${api.name} failed:`, error.message);
      errors.push(api.name);
      continue;
    }
  }
  
  throw new Error('All YouTube download APIs failed.');
}

module.exports = videoCommand;
