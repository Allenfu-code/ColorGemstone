document.addEventListener("DOMContentLoaded", async () => {
    const gallery = document.getElementById("gallery");
    const albumCategories = document.getElementById("album-categories");

    const response = await fetch("gallery.json");
    const albums = await response.json();

    albumCategories.innerHTML += Object.keys(albums).map(
        category => `<li><label><input type="checkbox" data-category="${category}" checked> ${category}</label></li>`
    ).join("");

        const albums = await response.json();
        gallery.innerHTML = "";

        // 建立分類勾選框
        albumCategories.innerHTML += Object.keys(albums).map(
            category => `<li><label><input type="checkbox" data-category="${category}" checked> ${category}</label></li>`
        ).join("");

        // 監聽勾選變更
        document.querySelectorAll("#album-categories input").forEach(checkbox => {
            checkbox.addEventListener("change", updateGallery);
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
    const gallery = document.getElementById("gallery");
    const selectedCategories = Array.from(document.querySelectorAll("#album-categories input:checked"))
        .map(input => input.dataset.category);

    fetch("gallery.json")
        .then(response => response.json())
        .then(albums => {
            gallery.innerHTML = `<h2>我的攝影作品</h2>`;
            const selectedAlbums = selectedCategories.includes("all") ? albums :
                Object.fromEntries(Object.entries(albums).filter(([key]) => selectedCategories.includes(key)));

            for (const [albumName, images] of Object.entries(selectedAlbums)) {
                const albumSection = document.createElement("section");
                albumSection.innerHTML = `<h3>${albumName}</h3><div class="album-container"></div>`;
                const albumContainer = albumSection.querySelector(".album-container");

                images.forEach(img => {
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

                albumSection.appendChild(albumContainer);
                gallery.appendChild(albumSection);
            }

            bindLightbox();
        });
}

// Lightbox 點擊放大功能
function bindLightbox() {
    document.querySelectorAll(".lightbox-trigger").forEach(img => {
        img.addEventListener("click", function () {
            openLightbox(this.dataset.src);
        });
    });

    itemsPerPageSelect.addEventListener("change", () => {
        itemsPerPage = parseInt(itemsPerPageSelect.value);
        currentPage = 1;
        renderGallery();
    });

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

    updateGallery();
});
