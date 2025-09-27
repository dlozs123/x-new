// 图标相关：URL 生成
function getIconUrl(screenName) {
    // 替换特殊字符 * : / 为 _
    let sanitizedName = screenName.replace(/[*:/]/g, '_');
    return `https://r4.dlozs.top/images/${sanitizedName}.jpg`;
}

// 懒加载核心：IntersectionObserver
function setupLazyLoading() {
    const lazyImages = document.querySelectorAll("img[data-src]");
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src; // 真正加载图片
                img.removeAttribute("data-src");
                obs.unobserve(img);
            }
        });
    }, { rootMargin: "50px" }); // 提前 50px 加载

    lazyImages.forEach(img => observer.observe(img));
}

// 渲染用户卡片
function loadUsers() {
    const userList = document.getElementById('user-list');

    // 为每个类别渲染 section
    Object.keys(userCategories).forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';

        const title = document.createElement('h2');
        title.textContent = category;
        categorySection.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'user-grid';

        const categoryUsers = userCategories[category];
        categoryUsers.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <img data-src="${getIconUrl(user.screenName)}" alt="${user.name}'s avatar">
                <p>${user.name} (@${user.screenName})</p>
            `;
            card.onclick = () => {
                window.location.href = `user.html?screen_name=${user.screenName}`;
            };
            grid.appendChild(card);
        });

        if (grid.children.length > 0) {
            categorySection.appendChild(grid);
            userList.appendChild(categorySection);
        }
    });

    // 初始化懒加载
    setupLazyLoading();
}
