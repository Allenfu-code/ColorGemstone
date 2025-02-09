document.addEventListener("DOMContentLoaded", () => {
    // 1. 初始化 Supabase 客戶端
    const { createClient } = window.supabase;
    const supabaseUrl = "https://jclwcnbsqpwtrgagalsr.supabase.co"; 
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbHdjbmJzcXB3dHJnYWdhbHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MDEzNDAsImV4cCI6MjA1Mzk3NzM0MH0.13xuYlYCS9uE5R_lopvJZuJD7BY85lEvY7G8xp204CY";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
    // 2. 解析 URL 參數，取得 photoUrl 與 album
    const params = new URLSearchParams(window.location.search);
    const photoUrl = params.get("url");
    const album = params.get("album") || "";
  
    if (!photoUrl) {
      document.body.innerHTML = "<p>找不到相片資料。</p>";
      return;
    }
  
    // 3. 取得畫面上的元素參考
    const mainPhoto = document.getElementById("mainPhoto");
    const thumbnailContainer = document.getElementById("thumbnailContainer");
    const prevPhotoBtn = document.getElementById("prevPhoto");
    const nextPhotoBtn = document.getElementById("nextPhoto");
  
    // DB 資訊顯示區
    const dbInfoResult = document.getElementById("dbInfoResult");
  
    // 4. 設定隱藏的 photoUrl 欄位 (供表單)
    const photoUrlField = document.getElementById("photoUrl");
    photoUrlField.value = photoUrl;
  
    // 5. 預設相冊欄位
    const photoAlbumField = document.getElementById("photoAlbum");
    photoAlbumField.value = album;
  
    // 6. 從 localStorage 讀取 photoDetails，如有就填到表單中
    let photoDetails = localStorage.getItem("photoDetails");
    if (photoDetails) {
      photoDetails = JSON.parse(photoDetails);
    } else {
      photoDetails = {};
    }
    if (photoDetails[photoUrl]) {
      const details = photoDetails[photoUrl];
      if (details.album)    photoAlbumField.value = details.album;
      if (details.time)     document.getElementById("photoTime").value = details.time;
      if (details.location) document.getElementById("photoLocation").value = details.location;
      if (details.description) document.getElementById("photoDescription").value = details.description;
    }
  
    // 7. 準備從 localStorage 裡篩選出「同相簿」的所有照片，用來做「多張圖片」切換
    let uploadedPhotos = localStorage.getItem("uploadedPhotos");
    let albumPhotos = [];
    if (uploadedPhotos) {
      uploadedPhotos = JSON.parse(uploadedPhotos);
      // 過濾相同 album 的照片
      albumPhotos = uploadedPhotos.filter(p => p.album === album);
    }
    // 若找不到當前這張，則補上
    const alreadyHasThisPhoto = albumPhotos.some(p => p.url === photoUrl);
    if (!alreadyHasThisPhoto) {
      albumPhotos.push({
        album: album,
        title: "",
        url: photoUrl
      });
    }
    // 讓當前照片排在第一個
    const currentIndex = albumPhotos.findIndex(p => p.url === photoUrl);
    if (currentIndex > 0) {
      const temp = albumPhotos[0];
      albumPhotos[0] = albumPhotos[currentIndex];
      albumPhotos[currentIndex] = temp;
    }
    let activeIndex = 0; // 用於大圖顯示的索引
  
    // 8. 函式：渲染大圖與縮圖
    function renderGallery() {
      if (!albumPhotos[activeIndex]) return;
      // (A) 顯示大圖
      mainPhoto.src = albumPhotos[activeIndex].url;
      // (B) 縮圖
      thumbnailContainer.innerHTML = "";
      albumPhotos.forEach((p, i) => {
        const thumbImg = document.createElement("img");
        thumbImg.src = p.url;
        thumbImg.alt = p.title || `Image ${i+1}`;
        if (i === activeIndex) {
          thumbImg.classList.add("selected");
        }
        // 點擊縮圖時，更新大圖
        thumbImg.addEventListener("click", () => {
          activeIndex = i;
          renderGallery();
        });
        thumbnailContainer.appendChild(thumbImg);
      });
    }
    // 呼叫初始渲染
    renderGallery();
  
    // 9. 綁定左右切換功能
    prevPhotoBtn.addEventListener("click", () => {
      activeIndex = (activeIndex - 1 + albumPhotos.length) % albumPhotos.length;
      renderGallery();
    });
    nextPhotoBtn.addEventListener("click", () => {
      activeIndex = (activeIndex + 1) % albumPhotos.length;
      renderGallery();
    });
  
    // 10. 從 Supabase 查詢並顯示對應的資料 (依 album 來查)
    async function loadDbInfo() {
      // 從資料表 ColorGemstone 根據 category = album 查詢
      const { data, error } = await supabase
        .from("ColorGemstone")
        .select("*")
        .eq("category", album);
  
      if (error) {
        console.error("查詢失敗：", error);
        dbInfoResult.innerHTML = "<p>無法查詢資料庫。</p>";
        return;
      }
      if (!data || data.length === 0) {
        dbInfoResult.innerHTML = "<p>此相簿目前無對應資料。</p>";
        return;
      }
  
      // 顯示查詢到的每筆資料
      let html = "";
      data.forEach((row, idx) => {
        html += `
        <div class="db-info-item" style="margin-bottom: 10px;">
          <p><strong>資料 #${idx + 1}</strong></p>
          <p>拍攝時間: ${row.captime || ""}</p>
          <p>地點: ${row.location || ""}</p>
          <p>說明: ${row.statement || ""}</p>
        </div>`;
      });
      dbInfoResult.innerHTML = html;
    }
    // 一開始就載入一次
    loadDbInfo();
  
    // 11. 「相片詳細表單」提交事件 → 更新 localStorage + 寫入 Supabase
    const form = document.getElementById("photoDetailForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const updatedAlbum = photoAlbumField.value;
      const updatedTime = document.getElementById("photoTime").value;
      const updatedLocation = document.getElementById("photoLocation").value;
      const updatedDescription = document.getElementById("photoDescription").value;
  
      // (a) 更新 localStorage 裡的 photoDetails
      photoDetails[photoUrl] = {
        album: updatedAlbum,
        time: updatedTime,
        location: updatedLocation,
        description: updatedDescription
      };
      localStorage.setItem("photoDetails", JSON.stringify(photoDetails));
  
      // (b) 更新 uploadedPhotos 中該相片的相冊類別
      let uploadedList = localStorage.getItem("uploadedPhotos");
      if (uploadedList) {
        uploadedList = JSON.parse(uploadedList);
        for (let i = 0; i < uploadedList.length; i++) {
          if (uploadedList[i].url === photoUrl) {
            uploadedList[i].album = updatedAlbum;
            // 可視需求也可更新 title, location, description 等
            break;
          }
        }
        localStorage.setItem("uploadedPhotos", JSON.stringify(uploadedList));
        // 通知 gallery.html 重新更新
        localStorage.setItem("albumUpdate", Date.now());
      }
  
      // (c) 寫入 Supabase (若您已經建立好 policy 允許 Insert)
      try {
        const { data, error } = await supabase
          .from("ColorGemstone")
          .insert([{
            category: updatedAlbum,
            captime: updatedTime,
            location: updatedLocation,
            statement: updatedDescription
          }]);
        if (error) {
          console.error("插入資料到 Supabase 時發生錯誤:", error);
        } else {
          console.log("成功插入資料到 Supabase:", data);
        }
      } catch (err) {
        console.error("無法連線到 Supabase:", err);
      }
  
      // (d) 顯示更新成功訊息
      const updateMessage = document.getElementById("updateMessage");
      updateMessage.textContent = "更新成功！";
  
      // (e) 再次查詢資料庫，刷新右側清單
      loadDbInfo();
    });
  });
  