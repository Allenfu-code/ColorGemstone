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

    const response = await fetch("gallery.json");
    const albums = await response.json();

    albumCategories.innerHTML += Object.keys(albums).map(
        category => `<li><label><input type="checkbox" data-category="${category}" checked> ${category}</label></li>`
    ).join("");

    document.querySelectorAll("#album-categories input").forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            selectedCategories = Array.from(document.querySelectorAll("#album-categories input:checked"))
                .map(input => input.dataset.category);
            updateGallery();
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
