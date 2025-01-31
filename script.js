document.addEventListener("DOMContentLoaded", async () => {
    const gallery = document.getElementById("gallery");
    const albumCategories = document.getElementById("album-categories");
    const paginationContainer = document.createElement("div");
    paginationContainer.id = "pagination";
    gallery.after(paginationContainer);

    let currentPage = 1;
    let photosPerPage = 6;
    let filteredImages = [];

    if (!gallery || !albumCategories) return;

    try {
        const response = await fetch("gallery.json");
        if (!response.ok) throw new Error("無法加載相簿數據");

        const albums = await response.json();
        gallery.innerHTML = "";

        // 建立分類勾選框
        albumCategories.innerHTML += Object.keys(albums).map(
            category => `<li><label><input type="checkbox" data-category="${category}" checked> ${category}</label></li>`
        ).join("");

        // 監聽勾選變更
        document.querySelectorAll("#album-categories input").forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                currentPage = 1;
                updateGallery();
            });
        });

        // 新增每頁顯示數量選擇框
        const perPageSelect = document.createElement("select");
        perPageSelect.innerHTML = `
            <option value="6">6</option>
            <option value="9">9</option>
            <option value="12">12</option>
        `;
        perPageSelect.value = photosPerPage;
        perPageSelect.addEventListener("change", (e) => {
            photosPerPage = parseInt(e.target.value);
            currentPage = 1;
            updateGallery();
        });

        paginationContainer.appendChild(perPageSelect);
        updateGallery();

    } catch (error) {
        console.error("相簿加載失敗:", error);
        gallery.innerHTML = "<p>相簿加載失敗，請稍後再試。</p>";
    }
});

// 更新相簿顯示
async function updateGallery() {
    const gallery = document.getElementById("gallery");
    const paginationContainer = document.getElementById("pagination");
    const selectedCategories = Array.from(document.querySelectorAll("#album-categories input:checked"))
        .map(input => input.dataset.category);

    try {
        const response = await fetch("gallery.json");
        const albums = await response.json();
        gallery.innerHTML = `<h2>我的攝影作品</h2>`;
        filteredImages = [];

        const selectedAlbums = selectedCategories.includes("all") ? albums :
            Object.fromEntries(Object.entries(albums).filter(([key]) => selectedCategories.includes(key)));

        for (const [albumName, images] of Object.entries(selectedAlbums)) {
            images.forEach(img => {
                filteredImages.push({ url: img.url, title: img.title, album: albumName });
            });
        }

        renderGallery();
        renderPagination();
    } catch (error) {
        console.error("相簿加載失敗:", error);
        gallery.innerHTML = "<p>相簿加載失敗，請稍後再試。</p>";
    }
}

// 渲染當前頁面內容
function renderGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = `<h2>我的攝影作品</h2>`;

    const startIndex = (currentPage - 1) * photosPerPage;
    const endIndex = startIndex + photosPerPage;
    const imagesToShow = filteredImages.slice(startIndex, endIndex);

    const albumContainer = document.createElement("div");
    albumContainer.classList.add("album-container");

    imagesToShow.forEach(img => {
        const imgWrapper = document.createElement("div");
        imgWrapper.classList.add("image-wrapper");

        const imgElement = document.createElement("img");
        imgElement.src = img.url;
        imgElement.alt = img.title;
        imgElement.classList.add("lightbox-trigger");
        imgElement.dataset.src = img.url;

        imgWrapper.appendChild(imgElement);
        albumContainer.appendChild(imgWrapper);
    });

    gallery.appendChild(albumContainer);
    bindLightbox();
}

// 渲染分頁按鈕
function renderPagination() {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(filteredImages.length / photosPerPage);
    if (totalPages <= 1) return;

    const prevButton = document.createElement("button");
    prevButton.textContent = "上一頁";
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderGallery();
            renderPagination();
        }
    });

    const nextButton = document.createElement("button");
    nextButton.textContent = "下一頁";
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderGallery();
            renderPagination();
        }
    });

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(nextButton);
}

// Lightbox 點擊放大功能
function bindLightbox() {
    document.querySelectorAll(".lightbox-trigger").forEach(img => {
        img.addEventListener("click", function () {
            openLightbox(this.dataset.src);
        });
    });
}

function openLightbox(imageSrc) {
    const lightbox = document.createElement("div");
    lightbox.classList.add("lightbox");
    lightbox.innerHTML = `
        <span class="close-btn">&times;</span>
        <img src="${imageSrc}">
    `;

    document.body.appendChild(lightbox);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || e.target.classList.contains("close-btn")) {
            lightbox.remove();
        }
    });
}
