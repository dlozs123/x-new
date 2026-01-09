// 共享函数：数据加载和合并多个 JSON 文件
async function loadAllJsonFiles() {
    try {
        // 先读取 index.json 获取所有文件列表
        const indexResponse = await fetch('json/index.json');
        if (!indexResponse.ok) {
            throw new Error('Failed to load json/index.json');
        }
        const indexData = await indexResponse.json();
        
        // 并行加载所有 JSON 文件
        const promises = indexData.files.map(filename => 
            fetch(`json/${filename}`)
                .then(res => {
                    if (!res.ok) {
                        console.warn(`Failed to load json/${filename}`);
                        return [];
                    }
                    return res.json();
                })
                .catch(err => {
                    console.warn(`Error loading json/${filename}:`, err);
                    return [];
                })
        );
        
        const results = await Promise.all(promises);
        
        // 合并所有数据
        const allTweets = results.flat();
        console.log(`Successfully loaded ${allTweets.length} tweets from ${indexData.files.length} files`);
        
        return allTweets;
    } catch (error) {
        console.error('Error loading JSON files:', error);
        return [];
    }
}

// 全局缓存数据，避免重复加载
window.tweetData = null;
async function getTweetData() {
    if (!window.tweetData) {
        window.tweetData = await loadAllJsonFiles();
    }
    return window.tweetData;
}

function formatDate(createdAt) {
    const date = new Date(createdAt);
    return date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// 媒体相关：URL 生成、推文渲染（包括媒体、互动和图片 modal）
function getMediaUrl(screenName, tweetId, index, createdAt, mediaItem) {
    const date = new Date(createdAt);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    let ext = 'jpg'; // 默认
    if (mediaItem.type === 'video' || mediaItem.type === 'animated_gif') {
        ext = 'mp4';
    } else if (mediaItem.original) {
        const match = mediaItem.original.match(/format=([^&]+)/);
        if (match) {
            ext = match[1];
        }
    }

    return `https://r3.dlozs.top/${screenName}_${tweetId}_${mediaItem.type}_${index + 1}_${dateStr}.${ext}`;
}

let BATCH_SIZE = 10; // 每次加载推文数量
let loadedCount = 0;
let userTweetsGlobal = []; // 全局保存该用户推文

async function loadUserTweets() {
    const urlParams = new URLSearchParams(window.location.search);
    const screenName = urlParams.get('screen_name');
    if (!screenName) {
        console.error('No screen_name provided in URL');
        return;
    }

    document.getElementById('user-name').textContent = `@${screenName}`;

    try {
        const data = await getTweetData();
        userTweetsGlobal = data.filter(tweet => tweet.screen_name === screenName);
        userTweetsGlobal.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        loadedCount = 0;
        document.getElementById('tweet-list').innerHTML = '';
        
        // 渲染时间线导航
        if (typeof renderTimelineNav === 'function') {
            renderTimelineNav(userTweetsGlobal);
        }
        
        loadNextBatch(); // 首次加载
        setupScrollLoad(); // 设置滚动懒加载
    } catch (error) {
        console.error('Failed to load tweets:', error);
        document.getElementById('tweet-list').innerHTML = '<p>加载推文失败，请稍后重试。</p>';
    }
}

// 加载下一批推文
function loadNextBatch() {
    const tweetList = document.getElementById('tweet-list');
    const nextBatch = userTweetsGlobal.slice(loadedCount, loadedCount + BATCH_SIZE);

    nextBatch.forEach(tweet => {
        const tweetDiv = document.createElement('div');
        tweetDiv.className = 'tweet';
        tweetDiv.dataset.tweetId = tweet.id;
        const formattedTime = formatDate(tweet.created_at);

        let mediaHtml = '';
        if (tweet.media && tweet.media.length > 0) {
            mediaHtml = '<div class="tweet-media">';
            tweet.media.forEach((mediaItem, index) => {
                const mediaUrl = getMediaUrl(tweet.screen_name, tweet.id, index, tweet.created_at, mediaItem);
                if (mediaItem.type === 'video' || mediaItem.type === 'animated_gif') {
                    const loopAttr = mediaItem.type === 'animated_gif' ? 'loop' : '';
                    mediaHtml += `
                        <video controls ${loopAttr} width="100%" alt="Tweet video ${index + 1}">
                            <source src="${mediaUrl}" type="video/mp4">
                            您的浏览器不支持视频标签。
                        </video>
                    `;
                } else {
                    mediaHtml += `<img src="${mediaUrl}" alt="Tweet media ${index + 1}" class="clickable-image">`;
                }
            });
            mediaHtml += '</div>';
        }

        tweetDiv.innerHTML = `
            <div class="tweet-header">
                <img src="${getIconUrl(tweet.screen_name)}" alt="${tweet.name}'s avatar" class="tweet-avatar">
                <div>
                    <span class="tweet-user">${tweet.name}</span>
                    <span class="tweet-screenname">@${tweet.screen_name}</span>
                    <div class="tweet-time">${formattedTime}</div>
                </div>
            </div>
            <div class="tweet-text">${tweet.full_text}</div>
            ${mediaHtml}
            <div class="tweet-actions">
                <span class="action-btn reply" data-tweet-id="${tweet.id}">💬 ${tweet.reply_count}</span>
                <span class="action-btn retweet" data-tweet-id="${tweet.id}">🔄 ${tweet.retweet_count}</span>
                <span class="action-btn like" data-tweet-id="${tweet.id}">❤️ ${tweet.favorite_count}</span>
            </div>
        `;

        tweetDiv.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
        });

        tweetList.appendChild(tweetDiv);
    });

    loadedCount += nextBatch.length;
    // 只有当有图片时才调用 setupImageModal
    if (document.querySelectorAll('.tweet-media .clickable-image').length > 0) {
        setupImageModal();
    }
}

// 设置滚动懒加载
function setupScrollLoad() {
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
            if (loadedCount < userTweetsGlobal.length) {
                loadNextBatch();
            }
        }
    });
}

// 设置图片点击弹出 modal
function setupImageModal() {
    let modal = document.getElementById('image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <span class="close">&times;</span>
            <img class="modal-content" id="modal-image">
        `;
        document.body.appendChild(modal);
        modal.style.display = 'none'; // 显式隐藏 modal

        modal.querySelector('.close').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    const images = document.querySelectorAll('.tweet-media .clickable-image');
    images.forEach(img => {
        if (!img.dataset.modalBound) {
            img.dataset.modalBound = "true";
            img.addEventListener('click', () => {
                const modalImg = document.getElementById('modal-image');
                modalImg.src = img.src;
                modal.style.display = 'flex';
            });
        }
    });
}