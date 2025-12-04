window.showCustomAlert = function(message) {
    return new Promise(resolve => {
        const modal = document.getElementById('system-modal');
        const msgEl = document.getElementById('system-modal-message');
        const okBtn = document.getElementById('system-modal-ok-btn');
        const cancelBtn = document.getElementById('system-modal-cancel-btn');
        const promptContainer = document.getElementById('system-modal-prompt-container');

        if (!modal) {
            window.alert(message);
            resolve();
            return;
        }

        msgEl.textContent = message;
        promptContainer.style.display = 'none';
        cancelBtn.style.display = 'none';
        okBtn.style.display = 'inline-block';
        okBtn.textContent = 'OK';

        modal.style.display = 'flex';
        okBtn.focus();

        const cleanup = () => {
            okBtn.removeEventListener('click', onOk);
            modal.style.display = 'none';
        };

        const onOk = () => {
            playSe('ボタン共通.mp3');
            cleanup();
            resolve();
        };

        okBtn.addEventListener('click', onOk);
    });
};

window.showCustomConfirm = function(message) {
    return new Promise(resolve => {
        const modal = document.getElementById('system-modal');
        const msgEl = document.getElementById('system-modal-message');
        const okBtn = document.getElementById('system-modal-ok-btn');
        const cancelBtn = document.getElementById('system-modal-cancel-btn');
        const promptContainer = document.getElementById('system-modal-prompt-container');

        if (!modal) {
            resolve(window.confirm(message));
            return;
        }

        msgEl.textContent = message;
        promptContainer.style.display = 'none';
        cancelBtn.style.display = 'inline-block';
        okBtn.style.display = 'inline-block';
        okBtn.textContent = 'OK';

        modal.style.display = 'flex';
        okBtn.focus();

        const cleanup = () => {
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            modal.style.display = 'none';
        };

        const onOk = () => {
            playSe('ボタン共通.mp3');
            cleanup();
            resolve(true);
        };

        const onCancel = () => {
            playSe('ボタン共通.mp3');
            cleanup();
            resolve(false);
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
};

window.showCustomPrompt = function(message, defaultValue = "") {
    return new Promise(resolve => {
        const modal = document.getElementById('system-modal');
        const msgEl = document.getElementById('system-modal-message');
        const okBtn = document.getElementById('system-modal-ok-btn');
        const cancelBtn = document.getElementById('system-modal-cancel-btn');
        const promptContainer = document.getElementById('system-modal-prompt-container');
        const input = document.getElementById('system-modal-input');

        if (!modal) {
            resolve(window.prompt(message, defaultValue));
            return;
        }

        msgEl.textContent = message;
        promptContainer.style.display = 'block';
        cancelBtn.style.display = 'inline-block';
        okBtn.style.display = 'inline-block';
        okBtn.textContent = 'OK';
        
        input.value = defaultValue;

        modal.style.display = 'flex';
        input.focus();
        input.select();

        const cleanup = () => {
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            input.removeEventListener('keydown', onKeydown);
            modal.style.display = 'none';
        };

        const onOk = () => {
            playSe('ボタン共通.mp3');
            const val = input.value;
            cleanup();
            resolve(val);
        };

        const onCancel = () => {
            playSe('ボタン共通.mp3');
            cleanup();
            resolve(null);
        };

        const onKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onOk();
            }
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        input.addEventListener('keydown', onKeydown);
    });
};

function makeDraggable(headerElement, containerElement) {
    if (!headerElement || !containerElement) return;
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    headerElement.addEventListener("mousedown", dragStart);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("mousemove", drag);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === headerElement || headerElement.contains(e.target)) {
            isDragging = true;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            containerElement.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
            xOffset = currentX;
            yOffset = currentY;
        }
    }
}

function setupDrawerResize() {
    const drawer = document.getElementById('common-drawer');
    const handle = drawer ? drawer.querySelector('.resize-handle') : null;
    
    if (!drawer || !handle) return;

    let isResizing = false;
    let startW, startH, startX, startY;

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        isResizingDrawer = true;
        startW = drawer.offsetWidth;
        startH = drawer.offsetHeight;
        startX = e.clientX;
        startY = e.clientY;
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        
        let newW = startW + (e.clientX - startX);
        let newH = startH + (e.clientY - startY);

        const rect = drawer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        const maxWidth = 2 * Math.min(centerX, vw - centerX);
        const maxHeight = 2 * Math.min(centerY, vh - centerY);
        
        newW = Math.max(500, Math.min(newW, maxWidth));
        newH = Math.max(400, Math.min(newH, maxHeight));
        
        drawer.style.width = `${newW}px`;
        drawer.style.height = `${newH}px`;
    }

    function handleMouseUp(e) {
        isResizing = false;
        setTimeout(() => {
            isResizingDrawer = false;
        }, 100);

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
}

function exportCardPreviewAsImage() {
    const previewArea = document.getElementById('common-card-preview');
    const previewImg = previewArea.querySelector('img');

    if (!previewImg || !previewImg.src || previewImg.src === window.location.href) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('エクスポートするカード画像がありません。');
        } else {
            alert('エクスポートするカード画像がありません。');
        }
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = previewImg.src;

    img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        const previewRect = previewArea.getBoundingClientRect();
        const scaleX = canvas.width / previewRect.width;
        const scaleY = canvas.height / previewRect.height;
        
        const fontScale = Math.min(scaleX, scaleY);

        const elementIds = [
            'preview-attribute',
            'preview-cost',
            'preview-top-right-stat',
            'preview-flavor-text',
            'preview-effect-text',
            'preview-card-name'
        ];

        elementIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el || el.style.display === 'none' || !el.textContent.trim()) return;

            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();

            const x = (rect.left - previewRect.left) * scaleX;
            const y = (rect.top - previewRect.top) * scaleY;
            const w = rect.width * scaleX;
            const h = rect.height * scaleY;

            if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
                ctx.save();
                ctx.fillStyle = style.backgroundColor;
                if (el.style.opacity) {
                    ctx.globalAlpha = parseFloat(el.style.opacity);
                }
                
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(x, y, w, h, parseFloat(style.borderRadius) * fontScale || 0);
                    ctx.fill();
                } else {
                    ctx.fillRect(x, y, w, h);
                }
                ctx.restore();
            }

            ctx.save();
            ctx.fillStyle = style.color;
            ctx.textAlign = style.textAlign === 'center' ? 'center' : (style.textAlign === 'right' ? 'right' : 'left');
            ctx.textBaseline = 'middle';

            const fontSize = parseFloat(style.fontSize) * fontScale; 
            const fontWeight = style.fontWeight;
            const fontFamily = style.fontFamily;
            ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

            const paddingLeft = parseFloat(style.paddingLeft) * scaleX;
            const paddingRight = parseFloat(style.paddingRight) * scaleX;
            const paddingTop = parseFloat(style.paddingTop) * scaleY;
            
            let textX = x;
            if (style.textAlign === 'center') {
                textX = x + w / 2;
            } else if (style.textAlign === 'right') {
                textX = x + w - paddingRight;
            } else {
                textX = x + paddingLeft;
            }
            
            const textContent = el.textContent;
            const lineHeight = fontSize * 1.2; 
            
            const maxTextWidth = w - (paddingLeft + paddingRight);

            if (id === 'preview-flavor-text' || id === 'preview-effect-text') {
                ctx.textBaseline = 'top';
                wrapText(ctx, textContent, textX, y + paddingTop, maxTextWidth, lineHeight);
            } else {
                ctx.textBaseline = 'middle';
                ctx.fillText(textContent, textX, y + h / 2, maxTextWidth);
            }

            ctx.restore();
        });

        const link = document.createElement('a');
        link.download = `card_export_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    img.onerror = () => {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('画像の読み込みに失敗しました。');
        } else {
            alert('画像の読み込みに失敗しました。');
        }
    };
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        let line = '';
        const words = lines[i].split(''); 
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n];
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
}

window.addLogMessage = function(message) {
    if (!actionLogBody) return;
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const time = new Date();
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
    
    entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${message}`;
    actionLogBody.appendChild(entry);
    actionLogBody.scrollTop = actionLogBody.scrollHeight;
};

function downloadActionLog() {
    if (!actionLogBody) return;
    const logText = actionLogBody.innerText;
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `action_log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function showPhaseCutin(text) {
    const overlay = document.getElementById('phase-cutin-overlay');
    const textEl = document.getElementById('phase-cutin-text');
    if (!overlay || !textEl) return;

    textEl.textContent = text;
    overlay.style.display = 'flex';
    
    textEl.classList.remove('phase-cutin-animate');
    void textEl.offsetWidth; 
    textEl.classList.add('phase-cutin-animate');

    setTimeout(() => {
        overlay.style.display = 'none';
    }, 2000); 
}

function showFloatingPopup(targetElement, value, label = "", type = "default") {
    if (!targetElement) return;
    const rect = targetElement.getBoundingClientRect();
    const popup = document.createElement('div');
    const sign = value > 0 ? '+' : '';
    
    const textValue = sign + value;
    popup.textContent = label ? `${label} ${textValue}` : textValue;
    
    popup.classList.add('floating-text-popup');
    
    if (value > 0) popup.classList.add('popup-increase');
    else popup.classList.add('popup-decrease');

    if (type) {
        const typeLower = type.toLowerCase();
        const direction = value > 0 ? 'increase' : 'decrease';
        popup.classList.add(`popup-${typeLower}-${direction}`);
    }

    popup.style.position = 'fixed';
    popup.style.left = (rect.left + rect.width / 2) + 'px';
    popup.style.top = (rect.top + rect.height / 2) + 'px';
    popup.style.zIndex = '9999';

    document.body.appendChild(popup);

    setTimeout(() => {
        if(popup.parentNode) popup.parentNode.removeChild(popup);
    }, 1500);
}

function adjustFontSize(element) {
    if (!element) return;
    const minSize = 8;
    element.style.fontSize = ''; 
    
    if (element.scrollWidth > element.clientWidth) {
        let currentSize = parseFloat(window.getComputedStyle(element).fontSize);
        while (element.scrollWidth > element.clientWidth && currentSize > minSize) {
            currentSize -= 1;
            element.style.fontSize = currentSize + 'px';
        }
    }
}

function duplicateCardToFreeSpace(sourceCard) {
    if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

    const freeSpaceContainer = document.getElementById('free-space-slots');
    if (!freeSpaceContainer) return;
    
    const slotsContainer = freeSpaceContainer.querySelector('.free-space-slot-container');
    if (!slotsContainer) return;

    const emptySlot = Array.from(slotsContainer.querySelectorAll('.card-slot')).find(s => !s.querySelector('.thumbnail'));
    
    if (!emptySlot) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert("フリースペースに空きがありません。");
        } else {
            alert("フリースペースに空きがありません。");
        }
        return;
    }

    const imgElement = sourceCard.querySelector('.card-image');
    const cardData = {
        src: imgElement ? imgElement.src : '',
        memo: sourceCard.dataset.memo || '',
        flavor1: sourceCard.dataset.flavor1 || '',
        flavor2: sourceCard.dataset.flavor2 || '',
        ownerPrefix: '', 
        customCounters: JSON.parse(sourceCard.dataset.customCounters || '[]'),
        isFlipped: false, 
        rotation: 0
    };

    if (typeof createCardThumbnail === 'function') {
        createCardThumbnail(cardData, emptySlot, false, false, '');
        if (typeof updateSlotStackState === 'function') updateSlotStackState(emptySlot);
        playSe('カードを配置する.mp3');
        
        const drawer = document.getElementById('player-drawer');
        if (drawer) {
            drawer.classList.add('open');
            if(typeof activateDrawerTab === 'function') activateDrawerTab('free-space-slots', drawer);
        }
    }
}

function setupHorizontalScroll() {
    const scrollableContainers = document.querySelectorAll('.deck-back-slot-container, .free-space-slot-container, .token-slot-container');

    scrollableContainers.forEach(container => {
        container.addEventListener('wheel', (e) => {
            if (container.scrollWidth <= container.clientWidth) {
                return;
            }
            e.preventDefault();
            container.scrollLeft += e.deltaY;
        });
    });
}

function activateDrawerTab(targetId, drawerElement) {
    if (!drawerElement) return;
    const drawerPanels = drawerElement.querySelectorAll('.drawer-panel');
    const drawerTabs = drawerElement.querySelectorAll('.drawer-tab-btn');
    
    drawerPanels.forEach(p => p.classList.toggle('active', p.id === targetId));
    drawerTabs.forEach(t => t.classList.toggle('active', t.dataset.target === targetId));

    if (targetId === 'common-spec-panel') {
        loadTextContent('txt/機能説明.txt', 'spec-text-content');
    } else if (targetId === 'common-about-panel') {
        loadTextContent('txt/S＆Mとは.txt', 'about-text-content');
    } else if (targetId === 'common-credit-panel') {
        loadTextContent('txt/クレジット.txt', 'credit-text-content');
    }
}

async function loadTextContent(filePath, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (!element.textContent.includes('読み込み中...')) return;

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        element.textContent = text;
    } catch (error) {
        element.textContent = `読み込みに失敗しました:\n${error.message}\n\n(ローカル環境の場合、ブラウザのセキュリティ制限によりテキストファイルを読み込めない場合があります。Webサーバー経由で実行してください)`;
        console.error("Text load failed:", error);
    }
}

function setupCounters(idPrefix) {
    const lpCounter = document.getElementById(idPrefix + 'counter-value');
    const manaCounter = document.getElementById(idPrefix + 'mana-counter-value');
    
    const attachAutoDecreaseLogic = (btnId, counter, intervalInputId) => {
        const btns = document.querySelectorAll(`[id="${btnId}"]`);
        
        btns.forEach(btn => {
            if (btn.hasAttribute('data-value')) return;

            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            btn = newBtn; 

            if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;

            const wrapperClass = idPrefix ? '.opponent-wrapper' : '.player-wrapper';
            const wrapper = document.querySelector(wrapperClass);

            btn.addEventListener('click', (e) => {
                const currentBtn = e.currentTarget;
                e.stopPropagation(); 

                if (currentBtn._decreaseTimerId) {
                    clearInterval(currentBtn._decreaseTimerId);
                    currentBtn._decreaseTimerId = null;
                    currentBtn.textContent = currentBtn.dataset.originalText;
                    currentBtn.style.backgroundColor = '';
                    currentBtn.style.boxShadow = '';
                    if(wrapper) wrapper.classList.remove('auto-decrease-active');
                    stopSe('自動減少.mp3');
                    playSe('ボタン共通.mp3');
                } else {
                    if (currentBtn.textContent !== '停止') currentBtn.dataset.originalText = currentBtn.textContent;
                    currentBtn.textContent = '停止';
                    currentBtn.style.backgroundColor = '#cc0000';
                    currentBtn.style.boxShadow = '0 2px #800000';
                    if(wrapper) wrapper.classList.add('auto-decrease-active');
                    playSe('自動減少.mp3', true);
                    
                    let interval = 1000;
                    const input = document.getElementById(intervalInputId);
                    if (input) {
                        const val = parseFloat(input.value);
                        if (!isNaN(val) && val > 0) {
                            interval = val * 1000;
                        }
                    }

                    currentBtn._decreaseTimerId = setInterval(() => {
                        const currentVal = parseInt(counter.value) || 0;
                        const newVal = Math.max(0, currentVal - 1);
                        
                        if (currentVal !== newVal) {
                            counter.value = newVal;
                            
                            let targetIcon = null;
                            let labelText = '';
                            let type = 'default';
                            
                            if (counter.id.includes('lp') || (counter.id.includes('counter-value') && !counter.id.includes('mana'))) {
                                labelText = 'LP';
                                type = 'LP';
                                const isOpp = idPrefix === 'opponent-';
                                const iconId = isOpp ? 'opponent-icon-zone' : 'icon-zone';
                                targetIcon = document.getElementById(iconId);
                            } 
                            else if (counter.id.includes('mana')) {
                                labelText = 'マナ';
                                type = 'Mana';
                                const isOpp = idPrefix === 'opponent-';
                                const iconId = isOpp ? 'opponent-icon-zone' : 'icon-zone';
                                targetIcon = document.getElementById(iconId);
                            }

                            if (targetIcon) {
                                showFloatingPopup(targetIcon, -1, labelText, type);
                            } else {
                                showFloatingPopup(counter, -1, labelText, type);
                            }
                        }
                        
                        if (newVal === 0 && counter.classList.contains('lp-counter-input') && typeof autoConfig !== 'undefined' && autoConfig.autoGameEnd) {
                            clearInterval(currentBtn._decreaseTimerId);
                            currentBtn._decreaseTimerId = null;
                            currentBtn.textContent = currentBtn.dataset.originalText;
                            currentBtn.style.backgroundColor = '';
                            currentBtn.style.boxShadow = '';
                            if(wrapper) wrapper.classList.remove('auto-decrease-active');
                            stopSe('自動減少.mp3');
                            
                            const msg = idPrefix ? 'YOU WIN!' : 'YOU LOSE...';
                            if (typeof window.showGameResult === 'function') {
                                window.showGameResult(msg);
                            }
                        }
                    }, interval);
                }
            });
        });
    };

    const intervalId = idPrefix ? 'opponent-auto-decrease-interval' : 'player-auto-decrease-interval';
    attachAutoDecreaseLogic(idPrefix + 'lp-auto-decrease-btn', lpCounter, intervalId);
    attachAutoDecreaseLogic(idPrefix + 'mana-auto-decrease-btn', manaCounter, intervalId);

    const counterWrapperId = idPrefix ? idPrefix + 'counter-wrapper' : 'player-counter-wrapper';
    const counterWrapper = document.getElementById(counterWrapperId);
    
    counterWrapper?.querySelectorAll('.counter-btn[data-value]').forEach(originalButton => {
        const button = originalButton.cloneNode(true);
        originalButton.parentNode.replaceChild(button, originalButton);

        const value = parseInt(button.dataset.value);
        const group = button.closest('.hand-counter-group');
        const targetCounter = group.querySelector('input[type="number"]') || group.querySelector('.hyphen-counter-input');
        
        let repeatTimer = null;
        let initialTimer = null;
        
        const performUpdate = () => {
            if(!targetCounter) return;
            
            if (typeof saveStateForUndo === 'function') saveStateForUndo();

            let currentVal;
            if (targetCounter.isContentEditable) {
                currentVal = parseInt(targetCounter.textContent) || 0;
                const newVal = Math.max(0, currentVal + value);
                targetCounter.textContent = newVal;
            } else {
                currentVal = parseInt(targetCounter.value) || 0;
                const newVal = Math.max(0, currentVal + value);
                targetCounter.value = newVal;
                
                if (newVal === 0 && targetCounter.classList.contains('lp-counter-input') && typeof autoConfig !== 'undefined' && autoConfig.autoGameEnd) {
                    const msg = idPrefix ? 'YOU WIN!' : 'YOU LOSE...';
                    if (typeof window.showGameResult === 'function') window.showGameResult(msg);
                }
            }
            
            let labelText = '';
            let type = 'default';
            const areaLabel = group.querySelector('.area-label');
            if (areaLabel) {
                if (areaLabel.tagName === 'INPUT') labelText = areaLabel.value; 
                else labelText = areaLabel.textContent; 
            }

            if (targetCounter.id.includes('lp') || (targetCounter.id.includes('counter-value') && !targetCounter.id.includes('mana'))) {
                type = 'LP';
            } else if (targetCounter.id.includes('mana')) {
                type = 'Mana';
            } else if (targetCounter.classList.contains('hyphen-counter-input')) {
                type = 'Hyphen';
            }

            if (targetCounter.id.includes('counter-value')) {
                const isOpponent = targetCounter.id.includes('opponent');
                const iconSlotId = isOpponent ? 'opponent-icon-zone' : 'icon-zone';
                const iconSlot = document.getElementById(iconSlotId);
                
                if (iconSlot) { 
                    showFloatingPopup(iconSlot, value, labelText, type);
                } else {
                    showFloatingPopup(targetCounter, value, labelText, type);
                }
            } else {
                showFloatingPopup(targetCounter, value, labelText, type);
            }
        };

        const startAction = (e) => {
            if (e.type === 'touchstart') {
                e.preventDefault(); 
            }
            if (e.button !== undefined && e.button !== 0) return; 
            
            e.stopPropagation();

            playSe('ボタン共通.mp3');
            performUpdate();
            
            initialTimer = setTimeout(() => {
                repeatTimer = setInterval(() => {
                    performUpdate();
                }, 200);
            }, 300);
        };
        
        const stopAction = (e) => {
            if(e) e.stopPropagation(); 
            clearTimeout(initialTimer);
            clearInterval(repeatTimer);
        };

        button.addEventListener('mousedown', startAction);
        button.addEventListener('mouseup', stopAction);
        button.addEventListener('mouseleave', stopAction);
        
        button.addEventListener('touchstart', startAction, { passive: false });
        button.addEventListener('touchend', stopAction);

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
}

function initKeyConfigUI() {
    const container = document.getElementById('key-config-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const keyLabels = {
        'toggleDrawer': 'ドロワー開閉',
        'draw': '1ドロー',
        'stepForward': 'ステップ進行',
        'tap': 'タップ',
        'flip': '反転',
        'toGrave': '墓地へ',
        'memo': 'メモ編集',
        'toggleNav': 'ナビ切替',
        'flipBoard': '盤面反転',
        'undo': 'Undo',
        'redo': 'Redo',
        
        'phaseStart': 'ターン開始',
        'phaseDraw': 'ドローフェイズ',
        'phaseMana': 'マナフェイズ',
        'phaseMain': 'メインフェイズ',
        'phaseBattle': 'バトルフェイズ',
        'phaseEnd': 'エンドフェイズ',
        'turnChange': 'ターンプレイヤー切替',
        'openDeck': 'デッキを開く',
        'openGrave': '墓地を開く',
        'openExclude': '除外を開く',
        'openSideDeck': 'EXデッキを開く',
        'openBank': 'バンクを開く',
        'rollDice': 'ダイスロール',
        'tossCoin': 'コイントス'
    };

    if (typeof keyConfig !== 'undefined') {
        Object.keys(keyConfig).forEach(action => {
            const label = keyLabels[action] || action;
            const item = createKeyConfigItem(action, label, keyConfig[action]);
            container.appendChild(item);
        });
    }
}

function createKeyConfigItem(action, label, currentKey) {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.marginBottom = '5px';
    div.style.borderBottom = '1px solid #555';
    div.style.paddingBottom = '2px';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.fontSize = '0.9em';
    labelSpan.style.color = '#ccc';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentKey;
    input.style.width = '60px';
    input.style.textAlign = 'center';
    input.style.backgroundColor = '#444';
    input.style.color = '#fff';
    input.style.border = '1px solid #666';
    input.style.borderRadius = '3px';
    input.readOnly = true;
    input.style.cursor = 'pointer';

    input.addEventListener('click', () => {
        input.value = 'Press...';
        input.style.backgroundColor = '#ffcc00';
        input.style.color = '#333';
        
        const keyHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            let newKey = e.key;
            if (newKey === ' ') newKey = 'Space';
            
            updateKeyConfig(action, newKey);
            input.value = newKey;
            
            input.style.backgroundColor = '#444';
            input.style.color = '#fff';
            document.removeEventListener('keydown', keyHandler);
        };
        document.addEventListener('keydown', keyHandler, { once: true });
    });

    div.appendChild(labelSpan);
    div.appendChild(input);
    return div;
}

function updateKeyConfig(action, newKey) {
    if (typeof keyConfig !== 'undefined') {
        keyConfig[action] = newKey;
    }
}

window.updateSettingsUIFromState = function() {
    if (bgmVolumeSlider && bgmVolumeVal && typeof bgmVolume !== 'undefined') {
        bgmVolumeSlider.value = bgmVolume;
        bgmVolumeVal.textContent = bgmVolume;
    }
    if (seVolumeSlider && seVolumeVal && typeof seVolume !== 'undefined') {
        seVolumeSlider.value = seVolume;
        seVolumeVal.textContent = seVolume;
    }
    
    const seContainer = document.getElementById('se-settings-container');
    if (seContainer && typeof seConfig !== 'undefined') {
        const checkboxes = seContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(box => {
            const seName = box.dataset.seName;
            if (seName && typeof seConfig[seName] !== 'undefined') {
                box.checked = seConfig[seName];
            }
        });
    }
    
    const effectContainer = document.getElementById('effect-settings-container');
    if (effectContainer && typeof effectConfig !== 'undefined') {
        const checkboxes = effectContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(box => {
            const key = box.dataset.effectKey;
            if (key && typeof effectConfig[key] !== 'undefined') {
                box.checked = effectConfig[key];
            }
        });
    }

    const autoContainer = document.getElementById('auto-config-container');
    if (autoContainer && typeof autoConfig !== 'undefined') {
        const checkboxes = autoContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(box => {
            const key = box.dataset.autoKey;
            if (key && typeof autoConfig[key] !== 'undefined') {
                box.checked = autoConfig[key];
            }
        });
    }
};