document.addEventListener("DOMContentLoaded", async () => {
    const gallery = document.getElementById("gallery");
    const albumCategories = document.getElementById("album-categories");

    if (!gallery || !albumCategories) return;

    try {
        const response = await fetch("gallery.json");
        if (!response.ok) throw new Error("無法加載相簿數據");

        const albums = await response.json();
        gallery.innerHTML = "";
        albumCategories.innerHTML += Object.keys(albums).map(
            category => `<li><a href="#" data-category="${category}">${category}</a></li>`
        ).join("");

        // 點擊分類顯示相簿
        document.querySelectorAll("#album-categories a").forEach(link => {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                document.querySelectorAll("#album-categories a").forEach(el => el.classList.remove("active"));
                this.classList.add("active");

                const selectedCategory = this.dataset.category;
                renderGallery(selectedCategory);
            });
        });

        // 預設顯示全部相簿
        renderGallery("all");

    } catch (error) {
        console.error("相簿加載失敗:", error);
        gallery.innerHTML = "<p>相簿加載失敗，請稍後再試。</p>";
    }
});

// 渲染相簿
function renderGallery(category) {
    const gallery = document.getElementById("gallery");
    fetch("gallery.json")
        .then(response => response.json())
        .then(albums => {
            gallery.innerHTML = `<h2>${category === "all" ? "所有攝影作品" : category}</h2>`;
            const selectedAlbums = category === "all" ? albums : { [category]: albums[category] };

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
