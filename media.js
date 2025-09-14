 在media.js中添加年份筛选功能

 媒体相关：URL 生成、推文渲染（包括媒体、互动和图片 modal）
function getMediaUrl(screenName, tweetId, index, createdAt, mediaItem) {
    const date = new Date(createdAt);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    let ext = 'jpg';  默认
    if (mediaItem.type === 'video'  mediaItem.type === 'animated_gif') {
        ext = 'mp4';
    } else if (mediaItem.original) {
        const match = mediaItem.original.match(format=([^&]+));
        if (match) {
            ext = match[1];
        }
    }

    return `httpsr3.dlozs.top${screenName}_${tweetId}_${mediaItem.type}_${index + 1}_${dateStr}.${ext}`;
}

 全局变量存储当前筛选状态
let currentFilteredYears = [];
let allTweets = [];

 提取推文中的年份
function extractYearsFromTweets(tweets) {
    const years = new Set();
    tweets.forEach(tweet = {
        const year = new Date(tweet.created_at).getFullYear();
        years.add(year);
    });
    return Array.from(years).sort((a, b) = b - a);  从新到旧排序
}

 创建年份筛选器
function createYearFilter(years) {
    const yearList = document.getElementById('year-list');
    yearList.innerHTML = '';
    
    years.forEach(year = {
        const yearItem = document.createElement('div');
        yearItem.className = 'year-item';
        yearItem.innerHTML = `
            input type=checkbox id=year-${year} value=${year} class=year-checkbox
            label for=year-${year}${year}年label
        `;
        yearList.appendChild(yearItem);
    });
    
     添加事件监听
    document.querySelectorAll('.year-checkbox').forEach(checkbox = {
        checkbox.addEventListener('change', updateYearFilter);
    });
    
     全选全不选功能
    document.getElementById('select-all-years').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.year-checkbox');
        checkboxes.forEach(checkbox = {
            checkbox.checked = this.checked;
        });
        updateYearFilter();
    });
}

 更新年份筛选
function updateYearFilter() {
    const selectedYears = [];
    document.querySelectorAll('.year-checkboxchecked').forEach(checkbox = {
        selectedYears.push(parseInt(checkbox.value));
    });
    
    currentFilteredYears = selectedYears.length  0  selectedYears  
        Array.from(document.querySelectorAll('.year-checkbox')).map(cb = parseInt(cb.value));
    
    filterTweetsByYear();
}

 根据选中的年份筛选推文
function filterTweetsByYear() {
    const tweetList = document.getElementById('tweet-list');
    tweetList.innerHTML = '';
    
    const filteredTweets = allTweets.filter(tweet = {
        const year = new Date(tweet.created_at).getFullYear();
        return currentFilteredYears.includes(year);
    });
    
    renderTweets(filteredTweets);
}

 渲染推文列表
function renderTweets(tweets) {
    const tweetList = document.getElementById('tweet-list');
    
    tweets.forEach(tweet = {
        const tweetDiv = document.createElement('div');
        tweetDiv.className = 'tweet';
        const formattedTime = formatDate(tweet.created_at);

        let mediaHtml = '';
        if (tweet.media && tweet.media.length  0) {
            mediaHtml = 'div class=tweet-media';
            tweet.media.forEach((mediaItem, index) = {
                const mediaUrl = getMediaUrl(tweet.screen_name, tweet.id, index, tweet.created_at, mediaItem);
                if (mediaItem.type === 'video'  mediaItem.type === 'animated_gif') {
                    const loopAttr = mediaItem.type === 'animated_gif'  'loop'  '';
                    mediaHtml += `
                        video controls ${loopAttr} width=100% alt=Tweet video ${index + 1}
                            source src=${mediaUrl} type=videomp4
                            您的浏览器不支持视频标签。
                        video
                    `;
                } else {
                    mediaHtml += `img src=${mediaUrl} alt=Tweet media ${index + 1} class=clickable-image`;
                }
            });
            mediaHtml += 'div';
        }

        tweetDiv.innerHTML = `
            div class=tweet-header
                img src=${getIconUrl(tweet.name)} alt=${tweet.name}'s avatar class=tweet-avatar
                div
                    span class=tweet-user${tweet.name}span
                    span class=tweet-screenname@${tweet.screen_name}span
                    div class=tweet-time${formattedTime}div
                div
            div
            div class=tweet-text${tweet.full_text}div
            ${mediaHtml}
            div class=tweet-actions
                span class=action-btn reply data-tweet-id=${tweet.id}💬 ${tweet.reply_count}span
                span class=action-btn retweet data-tweet-id=${tweet.id}🔄 ${tweet.retweet_count}span
                span class=action-btn like data-tweet-id=${tweet.id}❤️ ${tweet.favorite_count}span
            div
        `;

         添加简单互动
        tweetDiv.querySelectorAll('.action-btn').forEach(btn = {
            btn.addEventListener('click', () = {
                btn.classList.toggle('active');
            });
        });

        tweetList.appendChild(tweetDiv);
    });

     添加图片 modal 功能
    setupImageModal();
}

 侧边栏折叠功能
function setupSidebarToggle() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    
    toggleBtn.addEventListener('click', () = {
        sidebar.classList.toggle('collapsed');
        toggleBtn.textContent = sidebar.classList.contains('collapsed')  '▶'  '◀';
    });
}

async function loadUserTweets() {
    const urlParams = new URLSearchParams(window.location.search);
    const screenName = urlParams.get('screen_name');
    if (!screenName) return;

    document.getElementById('user-name').textContent = `@${screenName}`;

    const data = await getTweetData();
    const userTweets = data.filter(tweet = tweet.screen_name === screenName);
    userTweets.sort((a, b) = new Date(b.created_at) - new Date(a.created_at));  最新在上
    
     保存所有推文到全局变量
    allTweets = userTweets;
    
     提取年份并创建筛选器
    const years = extractYearsFromTweets(userTweets);
    createYearFilter(years);
    
     默认选择最近一年
    if (years.length  0) {
        const latestYear = years[0];
        document.getElementById(`year-${latestYear}`).checked = true;
        currentFilteredYears = [latestYear];
    }
    
     初始渲染
    filterTweetsByYear();
    
     设置侧边栏折叠功能
    setupSidebarToggle();
}

 设置图片点击弹出 modal
function setupImageModal() {
    const images = document.querySelectorAll('.tweet-media .clickable-image');
    let modal = document.getElementById('image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            span class=close&times;span
            img class=modal-content id=modal-image
        `;
        document.body.appendChild(modal);

         关闭 modal
        modal.querySelector('.close').addEventListener('click', () = {
            modal.style.display = 'none';
        });

         点击 modal 外部关闭
        window.addEventListener('click', (event) = {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    images.forEach(img = {
        img.addEventListener('click', () = {
            document.getElementById('modal-image').src = img.src;
            modal.style.display = 'block';
        });
    });
}