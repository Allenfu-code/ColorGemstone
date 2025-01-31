document.addEventListener("DOMContentLoaded", async () => {
    const gallery = document.getElementById("gallery");

    if (!gallery) return;

    try {
        const response = await fetch("gallery.json");
        if (!response.ok) throw new Error("無法加載相簿數據");

        const albums = await response.json();
        gallery.innerHTML = "";

        for (const [albumName, images] of Object.entries(albums)) {
            const albumSection = document.createElement("section");
            albumSection.innerHTML = `<h2>${albumName}</h2><div class="album-container"></div>`;
            const albumContainer = albumSection.querySelector(".album-container");

            images.forEach((img, index) => {
                const imgWrapper = document.createElement("div");
                imgWrapper.classList.add("image-wrapper");

                const imgElement = document.createElement("img");
                imgElement.src = img.url;
                imgElement.alt = img.title;
                imgElement.classList.add("lightbox-trigger");
                imgElement.dataset.src = img.url;
                imgElement.dataset.index = index;

                imgWrapper.appendChild(imgElement);
                albumContainer.appendChild(imgWrapper);
            });

            albumSection.appendChild(albumContainer);
            gallery.appendChild(albumSection);
        }

        bindLightbox();
    } catch (error) {
        console.error("相簿加載失敗:", error);
        gallery.innerHTML = "<p>相簿加載失敗，請稍後再試。</p>";
    }
});

function bindLightbox() {
    const images = document.querySelectorAll(".lightbox-trigger");
    images.forEach(img => {
        img.addEventListener("click", function () {
            openLightbox(this.dataset.src, Array.from(images));
        });
    });
}

function openLightbox(imageSrc, images) {
    let currentIndex = images.findIndex(img => img.dataset.src === imageSrc);

    const lightbox = document.createElement("div");
    lightbox.classList.add("lightbox");
    lightbox.innerHTML = `
        <span class="close-btn">&times;</span>
        <img src="${imageSrc}">
        <button class="prev-btn">&#10094;</button>
        <button class="next-btn">&#10095;</button>
    `;

    document.body.appendChild(lightbox);

    function updateImage(index) {
        if (index >= 0 && index < images.length) {
            currentIndex = index;
            lightbox.querySelector("img").src = images[currentIndex].dataset.src;
        }
    }

    document.querySelector(".prev-btn").addEventListener("click", () => updateImage(currentIndex - 1));
    document.querySelector(".next-btn").addEventListener("click", () => updateImage(currentIndex + 1));

    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || e.target.classList.contains("close-btn")) {
            lightbox.remove();
        }
    });
}
