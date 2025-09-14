// 共享函数：数据加载和时间格式化
async function loadData() {
    try {
        const response = await fetch('twitter.json');
        if (!response.ok) throw new Error('Failed to load JSON');
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON:', error);
        return [];
    }
}

// 全局缓存数据，避免重复加载
window.tweetData = null;
async function getTweetData() {
    if (!window.tweetData) {
        window.tweetData = await loadData();
    }
    return window.tweetData;
}

function formatDate(createdAt) {
    const date = new Date(createdAt);
    return date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}