// A-Frame テクスチャ高品質化コンポーネント
AFRAME.registerComponent('high-quality-texture', {
    init: function () {
        this.el.addEventListener('model-loaded', (e) => {
            const mesh = this.el.getObject3D('mesh');
            if (mesh) {
                mesh.traverse((node) => {
                    if (node.isMesh && node.material && node.material.map) {
                        node.material.map.generateMipmaps = false;
                        node.material.map.minFilter = THREE.LinearFilter;
                        node.material.map.magFilter = THREE.LinearFilter;
                        node.material.map.needsUpdate = true;
                    }
                });
            }
        });
    }
});

// 定数データ定義
const videoData = {
    'stamp-a-flag': { title: 'スポット1：校章スポット', src: 'jgvideo.mp4' },
    'stamp-b-flag': { title: 'スポット2：シューティングゲーム', src: 'GameVideo.mp4' },
    'stamp-c-flag': { title: 'スポット3：丸型スポット', src: 'jgvideo.mp4' }
};

const deptNames = {
    'stamp-a': '電子機械科',
    'stamp-b': '情報技術科',
    'stamp-c': '情報処理科',
    'stamp-d': '服飾デザイン科',
    'stamp-e': '食物調理科',
    'stamp-f': '流通経済科'
};

let clickCount = 0;
let clickTimer = null;
let nearLogTimeout = null;

// --- 画面制御関数 ---

// Nextボタン：説明画面を消して、ここで初めてカメラ（<a-scene>）を起動する
function startAR() {
    const screen = document.getElementById('explanation-screen');
    if (screen) {
        screen.remove();
    }

    // カメラ要素を動的に画面へ注入
    const sceneHTML = `
        <a-scene embedded vr-mode-ui="enabled: false;" arjs="sourceType: webcam; debugUIEnabled: false; patternRatio: 0.7;">
            <a-marker type="pattern" url="./pattern-koshou.patt" patternRatio="0.7" id="ar-marker-1"></a-marker>
            <a-marker type="pattern" url="./pattern-JGmaeker.patt" patternRatio="0.7" id="ar-marker-2"></a-marker>
            <a-marker type="pattern" url="./pattern-j.patt" patternRatio="0.7" id="ar-marker-3"></a-marker>
            <a-entity camera></a-entity>
        </a-scene>
    `;

    document.body.insertAdjacentHTML('beforeend', sceneHTML);

    // 追加されたマーカーに認識イベントを設定
    setupMarkerEvents();
}

function openCollection() {
    const modal = document.getElementById('collection-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeCollection() {
    const modal = document.getElementById('collection-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 学科ボタンを押したときの処理
function selectDepartment(deptKey) {
    openDeptVideos(deptKey);
}

// 学科別動画モーダルの表示
function openDeptVideos(deptKey) {
    const modal = document.getElementById('dept-video-modal');
    const title = document.getElementById('dept-title');
    const list = document.getElementById('dept-video-list');
    
    if (title) title.textContent = `${deptNames[deptKey] || '学科'} の動画一覧`;
    
    if (list) {
        list.innerHTML = '';

        // スポット1〜3（3つの動画枠）のデータを生成
        const spots = [
            { id: 'stamp-a-flag', title: 'スポット1：校章スポット', src: 'jgvideo2.mp4' },
            { id: 'stamp-b-flag', title: 'スポット2：シューティングゲーム', src: 'GameVideo.mp4' },
            { id: 'stamp-c-flag', title: 'スポット3：丸型スポット', src: 'jgvideo2.mp4' }
        ];

        spots.forEach(spot => {
            const isUnlocked = localStorage.getItem(spot.id) === '1';
            const div = document.createElement('div');
            div.className = `video-item ${isUnlocked ? 'unlocked' : 'locked'}`;

            if (isUnlocked) {
                // 解放済みの場合
                div.innerHTML = `
                    <p style="font-weight:bold; margin:0 0 8px 0; color:#059669;">🔓 ${spot.title}</p>
                    <video src="${spot.src}" controls style="width:100%; border-radius:8px; display:block;"></video>
                `;
            } else {
                // 未解放の場合（鍵がかかっている枠）
                div.innerHTML = `
                    <p style="font-weight:bold; margin:0; color:#475569;">🔒 ${spot.title}</p>
                    <div class="secret-box">
                        <div class="secret-icon">❓</div>
                        <small style="color:#64748b; font-weight:bold;">ARマーカーを探して解放しよう！</small>
                    </div>
                `;
            }
            list.appendChild(div);
        });
    }
    
    // 学科選択モーダルを隠し、学科動画一覧モーダルを開く
    const collectionModal = document.getElementById('collection-modal');
    if (collectionModal) collectionModal.style.display = 'none';
    if (modal) modal.style.display = 'flex';
}
    function playDeptVideo(src) {
    const list = document.getElementById('dept-video-list');
    if (list) {
        list.innerHTML = `
            <video src="${src}" controls autoplay style="width:100%; border-radius:8px; display:block;"></video>
        `;
    }
}

function closeDeptVideos() {
    const deptModal = document.getElementById('dept-video-modal');
    const collectionModal = document.getElementById('collection-modal');
    
    // 現在再生中の動画があれば停止する
    if (deptModal) {
        const videos = deptModal.querySelectorAll('video');
        videos.forEach(v => v.pause());
        deptModal.style.display = 'none';
    }
    
    // 学科選択モーダルを再度表示
    if (collectionModal) {
        collectionModal.style.display = 'flex';
    }
}

// 解放動画リスト描画関数
function renderCollectionList() {
    const listContainer = document.getElementById('collection-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    Object.keys(videoData).forEach(key => {
        const item = videoData[key];
        const isUnlocked = localStorage.getItem(key) === '1';

        const div = document.createElement('div');
        div.className = `video-item ${isUnlocked ? 'unlocked' : 'locked'}`;

        if (isUnlocked) {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0 0 8px 0; color:#059669;">🔓 ${item.title}</p>
                <video src="${item.src}" controls style="width:100%; border-radius:8px; display:block;"></video>
            `;
        } else {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0; color:#475569;">🔒 ${item.title}</p>
                <div class="secret-box">
                    <div class="secret-icon">❓</div>
                    <small style="color:#64748b; font-weight:bold;">ARマーカーを探して解放しよう！</small>
                </div>
            `;
        }
        listContainer.appendChild(div);
    });
}

// タイトル連続5回クリックによるデータリセット処理（開発用）
function handleTitleClick() {
    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount >= 5) {
        clickCount = 0;
        if (confirm('【開発者コマンド】スタンプと解放状況を全リセットしますか？')) {
            localStorage.clear();
            renderCollectionList();
            alert('すべての進行状況をリセットしました！');
        }
    } else {
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 1500);
    }
}

// 近くのオブジェクト読み取り案内ログ表示
function showNearObjectLog() {
    const logElem = document.getElementById('near-object-log');
    if (!logElem) return;

    logElem.classList.add('show');

    clearTimeout(nearLogTimeout);
    nearLogTimeout = setTimeout(() => {
        logElem.classList.remove('show');
    }, 10000);
}

// ARマーカー検知イベント設定関数
function setupMarkerEvents() {
    const markers = document.querySelectorAll('a-marker');

    markers.forEach(marker => {
        marker.addEventListener('markerFound', function() {
            console.log("検出成功:", this.id);

            const videoAttr = this.querySelector('a-video');
            const video = videoAttr ? document.querySelector(videoAttr.getAttribute('src')) : null;

            if (this.id === 'ar-marker-1') {
                localStorage.setItem('stamp-a-flag', '1');
            } else if (this.id === 'ar-marker-2') {
                localStorage.setItem('stamp-b-flag', '1');
            } else if (this.id === 'ar-marker-3') {
                localStorage.setItem('stamp-c-flag', '1');
            }

            if (video) {
                video.currentTime = 0;
                video.muted = false;
                video.play().catch(e => console.log('動画再生エラー:', e));
            }

            setTimeout(() => {
                showNearObjectLog();
            }, 1500);
        });

        marker.addEventListener('markerLost', function() {
            const videoAttr = this.querySelector('a-video');
            const video = videoAttr ? document.querySelector(videoAttr.getAttribute('src')) : null;
            if (video) {
                video.pause();
            }
        });
    });
}