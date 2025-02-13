document.addEventListener("DOMContentLoaded", async () => {
    // 1. 初始化 Supabase
    const { createClient } = window.supabase;
    const supabaseUrl = "https://jclwcnbsqpwtrgagalsr.supabase.co"; 
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbHdjbmJzcXB3dHJnYWdhbHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MDEzNDAsImV4cCI6MjA1Mzk3NzM0MH0.13xuYlYCS9uE5R_lopvJZuJD7BY85lEvY7G8xp204CY";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
    // 2. 取得畫面元素
    const albumCategories = document.getElementById("album-categories");
    const galleryImages = document.getElementById("gallery-images");
    const itemsPerPageSelect = document.getElementById("itemsPerPage");
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");
  
    if (!albumCategories || !galleryImages) return;
  
    // 3. 全局變數
    let albums = {};            // 以 {category: [{ photourl, statement, ...}, ...], ...} 儲存
    let filteredImages = [];    // 篩選後的相片
    let currentPage = 1;
    let itemsPerPage = parseInt(itemsPerPageSelect.value);
  
    // 4. 從資料表撈取全部相片
    try {
      // 查詢 ColorGemstone 取得 category, photourl, statement, captime, location... (看需求)
      const { data, error } = await supabase
        .from("ColorGemstone")
        .select("*"); // 或只選擇需要的欄位 e.g. .select("category, photourl, statement")
  
      if (error) {
        console.error("無法從資料表載入相簿數據：", error);
        galleryImages.innerHTML = "<p>相簿載入失敗，請稍後再試。</p>";
        return;
      }
      if (!data || data.length === 0) {
        galleryImages.innerHTML = "<p>目前沒有任何相片資料。</p>";
        return;
      }
  
      // 5. 整理成 albums 物件
      //    例如 albums[category] = [{ url, title, statement, ...}, ...]
      data.forEach(item => {
        const category = item.category || "其他";
        if (!albums[category]) {
          albums[category] = [];
        }
        albums[category].push({
          url: item.photourl,     // 圖片連結
          title: item.statement,  // 這裡暫用 statement 當作標題或描述
          album: item.category,   // 相簿名稱
          time: item.captime,     // 拍攝時間(若需使用)
          location: item.location // 拍攝地點(若需使用)
        });
      });
  
      // 6. 生成勾選式類別選單
      generateCategoryCheckboxes();
  
      // 7. 綁定事件：勾選框變化、每頁顯示數量、更換分頁按鈕
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
  
      // 預設「全部勾選」 => 顯示全部相片
      updateFilteredImages();
  
    } catch (err) {
      console.error("相簿載入失敗：", err);
      galleryImages.innerHTML = "<p>相簿載入失敗，請稍後再試。</p>";
    }
  
    // ------------------
    //    函式定義
    // ------------------
  
    // A. 產生側邊欄的勾選框：包含「全部」與各相片冊
    function generateCategoryCheckboxes() {
      albumCategories.innerHTML = "";
  
      // 建立「全部」選項
      const allDiv = document.createElement("div");
      allDiv.innerHTML = `
        <input type="checkbox" id="allCategories" data-category="all" checked>
        <label for="allCategories">全部</label>
      `;
      albumCategories.appendChild(allDiv);
  
      // 各個相片冊類別
      const categoryList = Object.keys(albums);
      categoryList.forEach(album => {
        const div = document.createElement("div");
        div.innerHTML = `
          <input type="checkbox" id="cat-${album}" data-category="${album}" checked>
          <label for="cat-${album}">${album}</label>
        `;
        albumCategories.appendChild(div);
      });
    }
  
    // B. 勾選框改變事件
    function handleCategoryChange(event) {
      const checkbox = event.target;
      if (checkbox.dataset.category === "all") {
        // 若點選「全部」，同步更新其他勾選框
        const allChecked = checkbox.checked;
        albumCategories.querySelectorAll("input[type=checkbox]").forEach(cb => {
          if (cb.dataset.category !== "all") {
            cb.checked = allChecked;
          }
        });
      } else {
        // 個別勾選框：若有任一未勾選 => 全部 checkbox 取消；全部都勾 => 全部 checkbox 也勾
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
  
    // C. 根據勾選的類別更新 filteredImages
    function updateFilteredImages() {
      // 取得所有 checkbox 狀態
      const checkboxes = albumCategories.querySelectorAll("input[type=checkbox]");
      let selectedCategories = [];
      checkboxes.forEach(chk => {
        if (chk.dataset.category !== "all" && chk.checked) {
          selectedCategories.push(chk.dataset.category);
        }
      });
  
      filteredImages = [];
      // 若全都沒勾，filteredImages 會是空; 或可另行判斷
      selectedCategories.forEach(cat => {
        if (albums[cat]) {
          // 將所有該分類的照片推進 filteredImages
          albums[cat].forEach(img => {
            filteredImages.push({
              url: img.url,
              title: img.title,
              album: img.album,
              time: img.time,
              location: img.location
            });
          });
        }
      });
  
      currentPage = 1;
      renderPaginatedGallery();
    }
  
    // D. 分頁渲染相片
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
  
      // 逐筆建立 DOM
      currentItems.forEach((img, idx) => {
        const imgWrapper = document.createElement("div");
        imgWrapper.classList.add("image-wrapper");
  
        const imgElement = document.createElement("img");
        imgElement.src = img.url || "";
        imgElement.alt = img.title || "";
        imgElement.classList.add("photo-detail-trigger");
  
        // 將全局 filteredImages 的索引與相冊存入 dataset
        imgElement.dataset.index = start + idx;
        imgElement.dataset.album = img.album || "其他";
  
        imgWrapper.appendChild(imgElement);
        galleryImages.appendChild(imgWrapper);
      });
  
      pageInfo.textContent = `第 ${currentPage} 頁，共 ${totalPages} 頁`;
      prevPageBtn.disabled = (currentPage <= 1);
      nextPageBtn.disabled = (currentPage >= totalPages);
  
      bindPhotoDetail();
    }
  
    // E. 綁定點擊事件，點擊後跳轉到 photo.html
    function bindPhotoDetail() {
      const images = document.querySelectorAll(".photo-detail-trigger");
      images.forEach(img => {
        img.addEventListener("click", function () {
          const photoUrl = this.src;
          const album = this.dataset.album;
          const params = new URLSearchParams();
          params.set("url", photoUrl);
          params.set("album", album);
          window.location.href = "photo.html?" + params.toString();
        });
      });
    }
  });
  