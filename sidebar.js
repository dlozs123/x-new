// 侧边栏相关功能
let timelineData = {}; // 存储时间线数据结构

// 初始化侧边栏
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const close = document.getElementById('sidebar-close');
    const overlay = document.getElementById('sidebar-overlay');
    
    // 切换侧边栏
    toggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });
    
    // 关闭侧边栏
    close.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

// 构建时间线数据结构
function buildTimelineData(tweets) {
    const timeline = {};
    
    tweets.forEach((tweet, index) => {
        const date = new Date(tweet.created_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        if (!timeline[year]) {
            timeline[year] = {};
        }
        if (!timeline[year][month]) {
            timeline[year][month] = {};
        }
        if (!timeline[year][month][day]) {
            timeline[year][month][day] = [];
        }
        
        timeline[year][month][day].push({
            index: index,
            tweetId: tweet.id
        });
    });
    
    return timeline;
}

// 渲染时间线导航
function renderTimelineNav(tweets) {
    timelineData = buildTimelineData(tweets);
    const nav = document.getElementById('timeline-nav');
    nav.innerHTML = '';
    
    const years = Object.keys(timelineData).sort((a, b) => b - a);
    
    years.forEach(year => {
        const yearItem = document.createElement('div');
        yearItem.className = 'timeline-item timeline-year';
        
        const yearHeader = document.createElement('div');
        yearHeader.className = 'timeline-header';
        yearHeader.innerHTML = `
            <span class="timeline-toggle">▶</span>
            <span class="timeline-label">${year}年</span>
        `;
        yearItem.appendChild(yearHeader);
        
        const monthsContainer = document.createElement('div');
        monthsContainer.className = 'timeline-children';
        
        const months = Object.keys(timelineData[year]).sort((a, b) => b - a);
        months.forEach(month => {
            const monthItem = document.createElement('div');
            monthItem.className = 'timeline-item timeline-month';
            
            const monthHeader = document.createElement('div');
            monthHeader.className = 'timeline-header';
            monthHeader.innerHTML = `
                <span class="timeline-toggle">▶</span>
                <span class="timeline-label">${month}月</span>
            `;
            monthItem.appendChild(monthHeader);
            
            const daysContainer = document.createElement('div');
            daysContainer.className = 'timeline-children';
            
            const days = Object.keys(timelineData[year][month]).sort((a, b) => b - a);
            days.forEach(day => {
                const dayItem = document.createElement('div');
                dayItem.className = 'timeline-item timeline-day';
                dayItem.innerHTML = `<span class="timeline-label">${day}日</span>`;
                
                // 点击日期跳转
                dayItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const lastTweet = timelineData[year][month][day][timelineData[year][month][day].length - 1];
                    jumpToTweet(lastTweet.index);
                });
                
                daysContainer.appendChild(dayItem);
            });
            
            monthItem.appendChild(daysContainer);
            
            // 点击月份跳转
            monthHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target.classList.contains('timeline-toggle')) {
                    monthItem.classList.toggle('expanded');
                } else {
                    const lastDay = days[0];
                    const lastTweet = timelineData[year][month][lastDay][timelineData[year][month][lastDay].length - 1];
                    jumpToTweet(lastTweet.index);
                }
            });
            
            monthsContainer.appendChild(monthItem);
        });
        
        yearItem.appendChild(monthsContainer);
        
        // 点击年份跳转
        yearHeader.addEventListener('click', (e) => {
            if (e.target.classList.contains('timeline-toggle')) {
                yearItem.classList.toggle('expanded');
            } else {
                const lastMonth = months[0];
                const lastDay = Object.keys(timelineData[year][lastMonth]).sort((a, b) => b - a)[0];
                const lastTweet = timelineData[year][lastMonth][lastDay][timelineData[year][lastMonth][lastDay].length - 1];
                jumpToTweet(lastTweet.index);
            }
        });
        
        nav.appendChild(yearItem);
    });
}

// 跳转到指定推文
function jumpToTweet(index) {
    // 确保推文已加载
    if (index >= loadedCount) {
        // 需要加载更多推文
        const targetBatch = Math.ceil((index + 1) / BATCH_SIZE);
        const currentBatch = Math.ceil(loadedCount / BATCH_SIZE);
        
        for (let i = currentBatch; i < targetBatch; i++) {
            loadNextBatch();
        }
    }
    
    // 等待DOM更新后滚动
    setTimeout(() => {
        const tweets = document.querySelectorAll('.tweet');
        if (tweets[index]) {
            tweets[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
            tweets[index].classList.add('highlight');
            setTimeout(() => {
                tweets[index].classList.remove('highlight');
            }, 2000);
        }
    }, 100);
}

// 在页面加载时初始化侧边栏
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
} else {
    initSidebar();
}
