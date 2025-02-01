document.addEventListener("DOMContentLoaded", async () => {
    const galleryContent = document.getElementById("gallery-content");
    const albumCategories = document.getElementById("album-categories");
    const galleryImages = document.getElementById("gallery-images");
    const itemsPerPageSelect = document.getElementById("itemsPerPage");
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");

    if (!galleryContent || !albumCategories || !galleryImages) return;

    let albums = {};
    let filteredImages = [];
    let currentPage = 1;
    let itemsPerPage = parseInt(itemsPerPageSelect.value);

    try {
        const response = await fetch("gallery.json");
        if (!response.ok) throw new Error("無法加載相簿數據");

        albums = await response.json();

        // 生成勾選式的相片冊類別選項
        generateCategoryCheckboxes();

        // 事件綁定：勾選框變化、每頁顯示數選擇、分頁按鈕
        albumCategories.querySelectorAll("input[type=checkbox]").forEach(chk => {
            chk.addEventListener("change", handleCategoryChange);
        });

        itemsPerPageSelect.addEventListener("change", () => {
            itemsPerPage = parseInt(itemsPerPageSelect.value);
            currentPage = 1;
            renderPaginatedGallery();
        });

        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderPaginatedGallery();
            }
        });

        nextPageBtn.addEventListener("click", () => {
            const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderPaginatedGallery();
            }
        });

        // 初始篩選：預設為全部勾選
        updateFilteredImages();
    } catch (error) {
        console.error("相簿加載失敗:", error);
        galleryContent.innerHTML = "<p>相簿加載失敗，請稍後再試。</p>";
    }

    // 產生側邊欄的勾選框：包含「全部」與各相片冊
    function generateCategoryCheckboxes() {
        albumCategories.innerHTML = "";
        // 「全部」選項
        const allDiv = document.createElement("div");
        allDiv.innerHTML = `<input type="checkbox" id="allCategories" data-category="all" checked>
                            <label for="allCategories">全部</label>`;
        albumCategories.appendChild(allDiv);
        // 各個相片冊類別
        Object.keys(albums).forEach(album => {
            const div = document.createElement("div");
            div.innerHTML = `<input type="checkbox" id="cat-${album}" data-category="${album}" checked>
                             <label for="cat-${album}">${album}</label>`;
            albumCategories.appendChild(div);
        });
    }

    // 當勾選框狀態改變時的處理
    function handleCategoryChange(event) {
        const checkbox = event.target;
        if (checkbox.dataset.category === "all") {
            // 若點選「全部」，則所有其他勾選框狀態隨之變動
            const allChecked = checkbox.checked;
            albumCategories.querySelectorAll("input[type=checkbox]")
                .forEach(cb => {
                    if (cb.dataset.category !== "all") {
                        cb.checked = allChecked;
                    }
                });
        } else {
            // 個別勾選框變動：若有任一未勾選，則取消「全部」勾選；若全部勾選，則自動勾選「全部」
            if (!checkbox.checked) {
                document.getElementById("allCategories").checked = false;
            } else {
                const others = albumCategories.querySelectorAll("input[type=checkbox][data-category]:not([data-category='all'])");
                const allChecked = Array.from(others).every(cb => cb.checked);
                if (allChecked) {
                    document.getElementById("allCategories").checked = true;
                }
            }
        }
        updateFilteredImages();
    }

    // 根據勾選的類別更新篩選後的相片集合
    function updateFilteredImages() {
        const checkboxes = albumCategories.querySelectorAll("input[type=checkbox]");
        let selectedCategories = [];
        checkboxes.forEach(chk => {
            if (chk.dataset.category !== "all" && chk.checked) {
                selectedCategories.push(chk.dataset.category);
            }
        });
        filteredImages = [];
        if (selectedCategories.length > 0) {
            selectedCategories.forEach(cat => {
                if (albums[cat]) {
                    albums[cat].forEach(img => {
                        filteredImages.push({
                            url: img.url,
                            title: img.title,
                            album: cat
                        });
                    });
                }
            });
        }
        currentPage = 1;
        renderPaginatedGallery();
    }

    // 根據當前分頁與每頁顯示數渲染相片
    function renderPaginatedGallery() {
        galleryImages.innerHTML = "";
        itemsPerPage = parseInt(itemsPerPageSelect.value);
        const totalItems = filteredImages.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages === 0) {
            pageInfo.textContent = "第 0 頁，共 0 頁";
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            galleryImages.innerHTML = "<p>此類別沒有照片。</p>";
            return;
        }
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentItems = filteredImages.slice(start, end);

        currentItems.forEach((img, idx) => {
            const imgWrapper = document.createElement("div");
            imgWrapper.classList.add("image-wrapper");

            const imgElement = document.createElement("img");
            imgElement.src = img.url;
            imgElement.alt = img.title;
            imgElement.classList.add("lightbox-trigger");
            // 將全局 filteredImages 陣列中的索引存入 data-index
            imgElement.dataset.index = start + idx;

            imgWrapper.appendChild(imgElement);
            galleryImages.appendChild(imgWrapper);
        });

        pageInfo.textContent = `第 ${currentPage} 頁，共 ${totalPages} 頁`;
        prevPageBtn.disabled = (currentPage <= 1);
        nextPageBtn.disabled = (currentPage >= totalPages);

        bindLightbox();
    }

    // 綁定 Lightbox 點擊事件，利用全局 filteredImages 陣列進行上一頁/下一頁瀏覽
    function bindLightbox() {
        const images = document.querySelectorAll(".lightbox-trigger");
        images.forEach(img => {
            img.addEventListener("click", function () {
                const idx = parseInt(this.dataset.index);
                openLightbox(idx);
            });
        });
    }

    // Lightbox 功能：使用 filteredImages 陣列進行瀏覽
    function openLightbox(startIndex) {
        let currentIndex = startIndex;
        const lightbox = document.createElement("div");
        lightbox.classList.add("lightbox");
        lightbox.innerHTML = `
            <span class="close-btn">&times;</span>
            <img src="${filteredImages[currentIndex].url}">
            <button class="prev-btn">&#10094;</button>
            <button class="next-btn">&#10095;</button>
        `;
        document.body.appendChild(lightbox);

        function updateImage(index) {
            if (index >= 0 && index < filteredImages.length) {
                currentIndex = index;
                lightbox.querySelector("img").src = filteredImages[currentIndex].url;
            }
        }

        lightbox.querySelector(".prev-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            updateImage(currentIndex - 1);
        });
        lightbox.querySelector(".next-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            updateImage(currentIndex + 1);
        });

        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox || e.target.classList.contains("close-btn")) {
                lightbox.remove();
            }
        });
    }
});
