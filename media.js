async function loadUserTweets() {
    const urlParams = new URLSearchParams(window.location.search);
    const screenName = urlParams.get('screen_name');
    if (!screenName) return;

    document.getElementById('user-name').textContent = `@${screenName}`;

    const data = await getTweetData();
    const userTweets = data.filter(tweet => tweet.screen_name === screenName);
    userTweets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // 最新在上

    // ---- 1. 识别年份 ----
    const years = [...new Set(userTweets.map(t => new Date(t.created_at).getFullYear()))]
        .sort((a, b) => b - a); // 倒序排列

    // ---- 2. 生成侧边栏复选框 ----
    const yearFilters = document.getElementById('year-filters');
    years.forEach(year => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" value="${year}">
            ${year}
        `;
        yearFilters.appendChild(label);
    });

    // 默认只勾选最新年份
    if (years.length > 0) {
        yearFilters.querySelector(`input[value="${years[0]}"]`).checked = true;
    }

    // ---- 3. 渲染函数 ----
    function renderTweets() {
        const selectedYears = Array.from(yearFilters.querySelectorAll('input:checked'))
            .map(cb => parseInt(cb.value));

        const tweetList = document.getElementById('tweet-list');
        tweetList.innerHTML = '';

        const filteredTweets = userTweets.filter(tweet =>
            selectedYears.includes(new Date(tweet.created_at).getFullYear())
        );

        filteredTweets.forEach(tweet => {
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
                            <video controls ${loopAttr} width="100%">
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
                    <span class="action-btn reply">💬 ${tweet.reply_count}</span>
                    <span class="action-btn retweet">🔄 ${tweet.retweet_count}</span>
                    <span class="action-btn like">❤️ ${tweet.favorite_count}</span>
                </div>
            `;

            tweetDiv.querySelectorAll('.action-btn').forEach(btn => {
                btn.addEventListener('click', () => btn.classList.toggle('active'));
            });

            tweetList.appendChild(tweetDiv);
        });

        setupImageModal();
    }

    // ---- 4. 绑定事件 ----
    yearFilters.addEventListener('change', renderTweets);

    // 初始渲染
    renderTweets();

    // ---- 5. 侧边栏收起/展开 ----
    document.getElementById('toggle-sidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });
}
