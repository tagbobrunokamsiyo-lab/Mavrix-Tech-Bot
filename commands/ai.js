// ai.js (Clean Minimalist)
const axios = require('axios');
const fetch = require('node-fetch');

// Minimal ASCII Art
const AI_LOGO = `╭─────────────╮
│     AI      │
╰─────────────╯`;

const PROCESSING = `┌─────────────┐
│ Processing  │
└─────────────┘`;

const SUCCESS = `┌─────────────┐
│   Response  │
└─────────────┘`;

async function aiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: `${AI_LOGO}\n\n` +
                      `*Commands:*\n` +
                      `• .gpt <question>\n` +
                      `• .gemini <question>`
            }, { quoted: message });
        }

        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, { 
                text: `${AI_LOGO}\nPlease provide a question after the command.`
            }, { quoted: message });
        }

        // Show processing indicator
        await sock.sendMessage(chatId, {
            react: { text: '✨', key: message.key }
        });

        const processingMsg = await sock.sendMessage(chatId, {
            text: `${PROCESSING}\nPlease wait...`
        });

        try {
            if (command === '.gpt') {
                // Multiple GPT API endpoints for redundancy
                const gptApis = [
                    `https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(query)}`,
                    `https://api.yanzbotz.my.id/api/ai/chatgpt-v4?text=${encodeURIComponent(query)}`,
                    `https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(query)}`,
                    `https://api.neoxr.my.id/api/openai?text=${encodeURIComponent(query)}`,
                    `https://api.siputzx.my.id/api/ai/chatgpt?content=${encodeURIComponent(query)}`
                ];

                let gptResponse = null;
                
                for (const api of gptApis) {
                    try {
                        console.log(`Trying GPT API: ${api}`);
                        const response = await axios.get(api, { timeout: 10000 });
                        
                        if (response.data?.success && response.data?.result) {
                            gptResponse = response.data.result.prompt || response.data.result;
                            break;
                        } else if (response.data?.response) {
                            gptResponse = response.data.response;
                            break;
                        }
                    } catch (e) {
                        console.log(`GPT API failed: ${e.message}`);
                        continue;
                    }
                }
                
                if (gptResponse) {
                    await sock.sendMessage(chatId, { 
                        delete: processingMsg.key 
                    });

                    await sock.sendMessage(chatId, {
                        text: `${SUCCESS}\n\n${gptResponse}`
                    }, { quoted: message });
                } else {
                    throw new Error('All GPT APIs failed');
                }
            } 
            else if (command === '.gemini') {
                // Multiple Gemini API endpoints
                const geminiApis = [
                    `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,
                    `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,
                    `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`,
                    `https://api.dreaded.site/api/gemini2?text=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(query)}`,
                    `https://api.yanzbotz.my.id/api/ai/gemini?text=${encodeURIComponent(query)}`,
                    `https://api.neoxr.my.id/api/gemini?text=${encodeURIComponent(query)}`,
                    `https://api.lolhuman.xyz/api/gemini?apikey=dannlaina&text=${encodeURIComponent(query)}`,
                    `https://api.caliph.my.id/api/gemini?text=${encodeURIComponent(query)}`,
                    `https://api.azz.biz.id/api/gemini?q=${encodeURIComponent(query)}`
                ];

                let geminiResponse = null;
                
                for (const api of geminiApis) {
                    try {
                        console.log(`Trying Gemini API: ${api}`);
                        const response = await fetch(api, { timeout: 10000 });
                        
                        if (!response.ok) continue;
                        
                        const data = await response.json();
                        
                        // Parse various response formats
                        if (data.message) {
                            geminiResponse = data.message;
                            break;
                        } else if (data.data) {
                            geminiResponse = data.data;
                            break;
                        } else if (data.answer) {
                            geminiResponse = data.answer;
                            break;
                        } else if (data.result) {
                            geminiResponse = data.result;
                            break;
                        } else if (data.response) {
                            geminiResponse = data.response;
                            break;
                        } else if (data.text) {
                            geminiResponse = data.text;
                            break;
                        }
                    } catch (e) {
                        console.log(`Gemini API failed: ${e.message}`);
                        continue;
                    }
                }
                
                if (geminiResponse) {
                    await sock.sendMessage(chatId, { 
                        delete: processingMsg.key 
                    });

                    await sock.sendMessage(chatId, {
                        text: `${SUCCESS}\n\n${geminiResponse}`
                    }, { quoted: message });
                } else {
                    throw new Error('All Gemini APIs failed');
                }
            }
        } catch (error) {
            console.error('API Error:', error);
            await sock.sendMessage(chatId, { 
                delete: processingMsg.key 
            });
            
            await sock.sendMessage(chatId, {
                text: `${AI_LOGO}\n\nService error. Please try again later.`
            }, { quoted: message });
        }
    } catch (error) {
        console.error('AI Command Error:', error);
        await sock.sendMessage(chatId, {
            text: `${AI_LOGO}\n\nSystem error. Please try again.`
        }, { quoted: message });
    }
}

module.exports = aiCommand;
