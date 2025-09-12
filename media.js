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

async function loadUserTweets() {
    const urlParams = new URLSearchParams(window.location.search);
    const screenName = urlParams.get('screen_name');
    if (!screenName) return;

    document.getElementById('user-name').textContent = `@${screenName}`;

    const data = await getTweetData();
    const userTweets = data.filter(tweet => tweet.screen_name === screenName);
    userTweets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // 最新在上

    const tweetList = document.getElementById('tweet-list');
    userTweets.forEach(tweet => {
        const tweetDiv = document.createElement('div');
        tweetDiv.className = 'tweet';
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
                <img src="${getIconUrl(tweet.name)}" alt="${tweet.name}'s avatar" class="tweet-avatar">
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

        // 添加简单互动
        tweetDiv.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
        });

        tweetList.appendChild(tweetDiv);
    });

    // 添加图片 modal 功能
    setupImageModal();
}

// 设置图片点击弹出 modal
function setupImageModal() {
    const images = document.querySelectorAll('.tweet-media .clickable-image');
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

        // 关闭 modal
        modal.querySelector('.close').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // 点击 modal 外部关闭
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // 确保 modal 默认隐藏
    modal.style.display = 'none';

    images.forEach(img => {
        img.addEventListener('click', () => {
            const modalImage = document.getElementById('modal-image');
            modalImage.src = ''; // 先清空，防止旧图片残留
            modalImage.src = img.src; // 重新设置 src
            modal.style.display = 'flex'; // 用 flex 显示，确保居中
        });
    });
}
