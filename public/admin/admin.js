let playlist = [];
let deletingId = null;
const container = document.getElementById("playlist");
const addMediaBtn = document.getElementById("addMediaBtn");
const fileInput = document.getElementById("fileInput");
const saveBtn = document.getElementById("saveBtn");
const toastEl = document.getElementById("toast");
const confirmModal = document.getElementById("confirmModal");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const removeAllBtn = document.getElementById('removeAllBtn');
const confirmAllModal = document.getElementById('confirmAllModal');
const confirmAllBtn = document.getElementById('confirmAll');
const cancelAllBtn = document.getElementById('cancelAll');

function showSkeletons(count = 3) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton';
    container.appendChild(s);
  }
}

async function loadPlaylist() {
  showSkeletons();
  try {
    const res = await fetch('/api/playlist');
    const data = await res.json();
    playlist = Array.isArray(data) ? data : data.items || [];
    render();
    initDrag();
  } catch (err) {
    container.innerHTML = '<div style="color:#ef4444">Error loading playlist</div>';
    console.error(err);
  }
}

function formatDuration(d) { return d ? `${d}s` : '—'; }

function render() {
  container.innerHTML = '';

  playlist.forEach(item => {
    const el = document.createElement('div');
    el.className = 'item';
    el.dataset.id = item.id;

    const thumb = item.url
      ? `<img src="${item.url}" alt="thumb">`
      : `<span style="font-size:20px">📷</span>`;

    const badgeClass =
      item.type?.toLowerCase() === 'image' ? 'image' :
      item.type?.toLowerCase() === 'video' ? 'video' : 'url';

    el.innerHTML = `
      <div class="card">
        <div class="thumb">${thumb}</div>
        <div class="media-info">
          <div class="title-row">
            <span class="badge ${badgeClass}">${(item.type || '').toUpperCase()}</span>
            <span class="title">${item.title || 'Untitled'}</span>
          </div>
          <div class="meta">Duration: ${formatDuration(item.duration)} &bull; Order: ${item.order}</div>
        </div>
        <div class="media-actions">
          <div class="drag-handle">☰</div>
          <button class="delete-btn" data-id="${item.id}">🗑</button>
        </div>
      </div>
    `;

    container.appendChild(el);
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      deletingId = e.currentTarget.dataset.id;
      confirmModal.classList.remove('hidden');
    });
  });
}

let sortableInstance = null;
function initDrag() {
  if (typeof Sortable === 'undefined') return;
  if (sortableInstance) sortableInstance.destroy();

  sortableInstance = Sortable.create(container, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: async () => {
      const ids = Array.from(container.children).map(ch => ch.dataset.id);
      const reordered = ids.map((id, index) => {
        const item = playlist.find(p => p.id === id);
        return { ...item, order: index };
      });
      playlist = reordered;
      await saveOrder(true);
    }
  });
}

async function saveOrder(auto = false) {
  try {
    saveBtn.classList.add('disabled');
    saveBtn.disabled = true;
    const payload = playlist.map(item => ({ id: item.id || item._id }));
    const res = await fetch('/api/playlist/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Save failed');
    await loadPlaylist();
    showToast(auto ? 'Playlist order updated' : 'Playlist order saved');
  } catch (err) {
    showToast('Error saving order');
    console.error(err);
  } finally {
    saveBtn.classList.remove('disabled');
    saveBtn.disabled = false;
  }
}

saveBtn.addEventListener('click', () => saveOrder(false));

confirmDeleteBtn.addEventListener('click', async () => {
  if (!deletingId) return;
  try {
    confirmDeleteBtn.disabled = true;
    const res = await fetch(`/api/playlist/${deletingId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    await loadPlaylist();
    showToast('Item deleted successfully');
  } catch (err) {
    console.error(err);
    showToast('Error deleting item');
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmModal.classList.add('hidden');
    deletingId = null;
  }
});

cancelDeleteBtn.addEventListener('click', () => {
  deletingId = null;
  confirmModal.classList.add('hidden');
});

removeAllBtn && removeAllBtn.addEventListener('click', () => {
  confirmAllModal && confirmAllModal.classList.remove('hidden');
});

confirmAllBtn && confirmAllBtn.addEventListener('click', async () => {
  try {
    confirmAllBtn.disabled = true;
    const res = await fetch('/api/playlist', { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete all failed');
    await loadPlaylist();
    showToast('All media removed');
  } catch (err) {
    console.error(err);
    showToast('Error removing all media');
  } finally {
    confirmAllBtn.disabled = false;
    confirmAllModal && confirmAllModal.classList.add('hidden');
  }
});

cancelAllBtn && cancelAllBtn.addEventListener('click', () => {
  confirmAllModal && confirmAllModal.classList.add('hidden');
});

// ===== Add Media Handler =====
addMediaBtn && addMediaBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput && fileInput.addEventListener('change', async (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  await uploadFiles(files);
  fileInput.value = '';
});

async function uploadFiles(files) {
  const formData = new FormData();
  for (let file of files) {
    formData.append('file', file);
  }

  try {
    addMediaBtn.disabled = true;
    showToast('Uploading...');
    
    const res = await fetch('/api/playlist', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Upload failed');
    
    const data = await res.json();
    
    await loadPlaylist();
    showToast(`${files.length} file(s) uploaded successfully`);
  } catch (err) {
    console.error('Upload error:', err);
    showToast('Error uploading files');
  } finally {
    addMediaBtn.disabled = false;
  }
}

function showToast(msg = 'Playlist order updated') {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 3000);
}

loadPlaylist();
