document.addEventListener("DOMContentLoaded", async () => {
    const gallery = document.getElementById("gallery");
    const uploadForm = document.getElementById("upload-form");
    const fileInput = document.getElementById("file-input");

    if (!gallery) return;

    // 加載已存圖片
    let albums = JSON.parse(localStorage.getItem("albums")) || {};

    function renderGallery() {
        gallery.innerHTML = "<h2>我的相簿</h2>";
        Object.entries(albums).forEach(([albumName, images]) => {
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
        });

        bindLightbox();
    }

    function bindLightbox() {
        document.querySelectorAll(".lightbox-trigger").forEach(img => {
            img.addEventListener("click", function() {
                openLightbox(this.dataset.src);
            });
        });
    }

    function openLightbox(imageSrc) {
        const lightbox = document.createElement("div");
        lightbox.classList.add("lightbox");
        lightbox.innerHTML = `<img src="${imageSrc}"><span class="close-btn">&times;</span>`;
        document.body.appendChild(lightbox);

        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox || e.target.classList.contains("close-btn")) {
                lightbox.remove();
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") lightbox.remove();
        }, { once: true });
    }

    // 上傳圖片
    uploadForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const newImage = { url: reader.result, title: file.name };
                if (!albums["我的上傳"]) albums["我的上傳"] = [];
                albums["我的上傳"].push(newImage);
                localStorage.setItem("albums", JSON.stringify(albums));
                renderGallery();
            };
            reader.readAsDataURL(file);
        }
    });

    renderGallery();
});
