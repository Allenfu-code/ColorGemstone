document.addEventListener("DOMContentLoaded", async () => {
    const gallery = document.getElementById("gallery");
    const albumCategories = document.getElementById("album-categories");
    const itemsPerPageSelect = document.getElementById("itemsPerPage");
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");

    let currentPage = 1;
    let itemsPerPage = parseInt(itemsPerPageSelect.value);
    let selectedCategories = ["all"];
    let allImages = [];

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
                selectedCategories = Array.from(document.querySelectorAll("#album-categories input:checked"))
                    .map(input => input.dataset.category);
                updateGallery();
            });
        });

        // 監聽分頁數變更
        itemsPerPageSelect.addEventListener("change", () => {
            itemsPerPage = parseInt(itemsPerPageSelect.value);
            currentPage = 1;
            renderGallery();
        });

        // 監聽分頁按鈕
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderGallery();
            }
        });

        nextPageBtn.addEventListener("click", () => {
            if (currentPage * itemsPerPage < allImages.length) {
                currentPage++;
                renderGallery();
            }
        });

        // 預設顯示全部相簿
        updateGallery();

    } catch (error) {
        console.error("相簿加載失敗:", error);
        gallery.innerHTML = "<p>相簿加載失敗，請稍後再試。</p>";
    }
});

// 更新相簿顯示
function updateGallery() {
    fetch("gallery.json")
        .then(response => response.json())
        .then(albums => {
            allImages = [];

            const selectedAlbums = selectedCategories.includes("all") ? albums :
                Object.fromEntries(Object.entries(albums).filter(([key]) => selectedCategories.includes(key)));

            for (const [albumName, images] of Object.entries(selectedAlbums)) {
                images.forEach(img => {
                    allImages.push({ album: albumName, ...img });
                });
            }

            currentPage = 1;
            renderGallery();
        });
}

// 渲染分頁內容
function renderGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedImages = allImages.slice(start, end);

    if (paginatedImages.length === 0) {
        gallery.innerHTML = "<p>沒有符合條件的相片。</p>";
        return;
    }

    const albumContainer = document.createElement("div");
    albumContainer.classList.add("album-container");

    paginatedImages.forEach(img => {
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

    // 更新分頁資訊
    pageInfo.textContent = `第 ${currentPage} 頁`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage * itemsPerPage >= allImages.length;
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
