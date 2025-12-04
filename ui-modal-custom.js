function performMemoSave() {
    if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

    const newMemo = memoTextarea.value;
    
    let targets = [currentMemoTarget];
    if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(currentMemoTarget)) {
        targets = selectedCards;
    }

    targets.forEach(target => {
        if (!target) return;
        
        if (newMemo) {
            target.dataset.memo = newMemo;
        } else {
            delete target.dataset.memo;
        }
        
        if (!target.classList.contains('decoration-stock-item')) {
            if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                recordAction({
                    type: 'memoChange',
                    zoneId: getParentZoneId(target.parentNode),
                    cardIndex: Array.from(target.parentNode.parentNode.children).indexOf(target.parentNode),
                    memo: newMemo
                });
            }
            
            if (target === currentMemoTarget && typeof window.updateCardPreview === 'function') {
                window.updateCardPreview(target);
            }

            if (typeof isBattleConfirmMode !== 'undefined' && isBattleConfirmMode) {
                if (typeof updateBattleConfirmModal === 'function') {
                    updateBattleConfirmModal();
                }
            }
        } else {
            const container = target.parentNode;
            const firstItem = container.querySelector('.decoration-stock-item');
            if (target === firstItem) {
                const targetType = target.dataset.targetType;
                const owner = target.dataset.owner;
                updateZoneDecorationFromStock(targetType, owner, container);
            }
        }
    });

    memoEditorModal.style.display = 'none';
    currentMemoTarget = null;
    currentMemoOriginalText = '';
}

function performMemoCancel() {
    if (currentMemoTarget && currentMemoOriginalText !== undefined) {
        currentMemoTarget.dataset.memo = currentMemoOriginalText;
        if (typeof window.updateCardPreview === 'function') {
            window.updateCardPreview(currentMemoTarget);
        }
    }
    memoEditorModal.style.display = 'none';
    currentMemoTarget = null;
    currentMemoOriginalText = '';
}

function openMemoEditor() {
    memoEditorModal.style.display = 'flex';
    memoTextarea.focus();
    
    const currentSize = parseFloat(window.getComputedStyle(memoTextarea).fontSize);
    if(memoFontSizeInput) memoFontSizeInput.value = currentSize;
    if(memoWidthInput) memoWidthInput.value = memoEditorModal.offsetWidth;
    if(memoHeightInput) memoHeightInput.value = memoEditorModal.offsetHeight;
    
    if (currentMemoTarget) {
        currentMemoOriginalText = currentMemoTarget.dataset.memo || '';
    }
}

function updateMemoEditorStyle() {
    if (!memoEditorModal || !memoTextarea) return;
    
    const size = memoFontSizeInput ? memoFontSizeInput.value : 16;
    const width = memoWidthInput ? memoWidthInput.value : 500;
    const height = memoHeightInput ? memoHeightInput.value : 200;
    
    memoTextarea.style.fontSize = size + 'px';
    memoEditorModal.style.width = width + 'px';
    memoEditorModal.style.minHeight = height + 'px'; 
}

function openFlavorEditor(targetThumbnail) {
    if (!targetThumbnail) return;
    currentFlavorTarget = targetThumbnail;
    flavorEditorHeader.textContent = `フレーバーイラスト設定`;
    updateFlavorPreview(1, currentFlavorTarget.dataset.flavor1);
    updateFlavorPreview(2, currentFlavorTarget.dataset.flavor2);
    flavorEditorModal.style.display = 'block';
}

function closeFlavorEditor() {
    flavorEditorModal.style.display = 'none';
    currentFlavorTarget = null;
}

function updateFlavorPreview(slotNumber, imgSrc) {
    const previewEl = (slotNumber === 1) ? flavorPreview1 : flavorPreview2;
    if (!previewEl) return;
    previewEl.innerHTML = '';
    if (imgSrc) {
        const img = document.createElement('img');
        img.src = imgSrc;
        previewEl.appendChild(img);
    }
}

function deleteFlavorImage(slotNumber) {
    if (!currentFlavorTarget) return;
    if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

    if (slotNumber === 1) {
        delete currentFlavorTarget.dataset.flavor1;
        updateFlavorPreview(1, null);
    } else if (slotNumber === 2) {
        delete currentFlavorTarget.dataset.flavor2;
        updateFlavorPreview(2, null);
    }
    if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
        recordAction({
            type: 'flavorDelete',
            zoneId: getParentZoneId(currentFlavorTarget.parentNode),
            cardIndex: Array.from(currentFlavorTarget.parentNode.parentNode.children).indexOf(currentFlavorTarget.parentNode),
            slotNumber: slotNumber
        });
    }
    if (typeof window.updateCardPreview === 'function') {
        window.updateCardPreview(currentFlavorTarget);
    }
}

function handleFlavorFile(file, slotNumber) {
    if (!currentFlavorTarget) return;
    if (!file || !file.type.startsWith('image/')) {
        console.warn("画像ファイルを選択してください。");
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

        const imgSrc = event.target.result;
        if (slotNumber === 1) {
            currentFlavorTarget.dataset.flavor1 = imgSrc;
            updateFlavorPreview(1, imgSrc);
        } else if (slotNumber === 2) {
            currentFlavorTarget.dataset.flavor2 = imgSrc;
            updateFlavorPreview(2, imgSrc);
        }
        
        if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
            recordAction({
                type: 'flavorUpdate',
                zoneId: getParentZoneId(currentFlavorTarget.parentNode),
                cardIndex: Array.from(currentFlavorTarget.parentNode.parentNode.children).indexOf(currentFlavorTarget.parentNode),
                slotNumber: slotNumber,
                imgSrc: imgSrc
            });
        }
        if (typeof window.updateCardPreview === 'function') {
            window.updateCardPreview(currentFlavorTarget);
        }
    };
    reader.readAsDataURL(file);
}

function openFlavorFileInput(slotNumber) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (event) => {
        try {
            const file = event.target.files[0];
            if (file) {
                handleFlavorFile(file, slotNumber);
            }
        } catch (error) {
            console.error("フレーバー画像の読み込みに失敗:", error);
        } finally {
            if (document.body.contains(fileInput)) {
                document.body.removeChild(fileInput);
            }
        }
    });
    fileInput.addEventListener('cancel', () => {
         if (document.body.contains(fileInput)) {
            document.body.removeChild(fileInput);
         }
    });
    document.body.appendChild(fileInput);
    isFileDialogOpen = true;
    fileInput.click();
    setTimeout(() => { isFileDialogOpen = false; }, 100);
}

function openCustomCounterModal(targetCard) {
    currentCustomCounterTarget = targetCard;
    renderCustomCounterList();
    
    newCounterNameInput.value = '';
    newCounterImageSrc = null;
    newCounterImageDrop.innerHTML = '画像D&Dまたはクリック';
    newCounterImageDrop.style.backgroundImage = '';
    
    customCounterModal.style.display = 'block';
}

function closeCustomCounterModal() {
    customCounterModal.style.display = 'none';
    currentCustomCounterTarget = null;
}

function handleNewCounterImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        newCounterImageSrc = e.target.result;
        newCounterImageDrop.innerHTML = '';
        newCounterImageDrop.style.backgroundImage = `url(${newCounterImageSrc})`;
        newCounterImageDrop.style.backgroundSize = 'contain';
        newCounterImageDrop.style.backgroundRepeat = 'no-repeat';
        newCounterImageDrop.style.backgroundPosition = 'center';
    };
    reader.readAsDataURL(file);
}

async function createNewCustomCounterType() {
    const name = newCounterNameInput.value.trim();
    if (!name) {
        if (typeof showCustomAlert === 'function') {
            await showCustomAlert('カウンター名を入力してください');
        } else {
            alert('カウンター名を入力してください');
        }
        return;
    }
    if (!newCounterImageSrc) {
        if (typeof showCustomAlert === 'function') {
            await showCustomAlert('画像を設定してください');
        } else {
            alert('画像を設定してください');
        }
        return;
    }

    const id = String(Date.now());
    const newCounter = { id, name, icon: newCounterImageSrc };
    
    if (typeof customCounterTypes !== 'undefined') {
        customCounterTypes.push(newCounter);
    } else {
        console.error("customCounterTypes is not defined");
        customCounterTypes = [newCounter];
    }
    
    playSe('ボタン共通.mp3');
    renderCustomCounterList();
    
    newCounterNameInput.value = '';
    newCounterImageSrc = null;
    newCounterImageDrop.innerHTML = '画像D&Dまたはクリック';
    newCounterImageDrop.style.backgroundImage = '';
}

async function deleteCustomCounterType(id) {
    const confirmed = typeof showCustomConfirm === 'function' 
        ? await showCustomConfirm('このカウンター種類を削除しますか？（使用中のカードからは消えません）')
        : confirm('このカウンター種類を削除しますか？（使用中のカードからは消えません）');

    if (!confirmed) return;
    
    if (typeof customCounterTypes !== 'undefined') {
        const index = customCounterTypes.findIndex(c => String(c.id) === String(id));
        if (index > -1) {
            customCounterTypes.splice(index, 1);
        }
    }
    
    playSe('ボタン共通.mp3');
    renderCustomCounterList();
}

function renderCustomCounterList() {
    customCounterListContainer.innerHTML = '';
    
    if (typeof customCounterTypes !== 'undefined') {
        customCounterTypes.forEach(counter => {
            const item = document.createElement('div');
            item.className = 'counter-list-item';
            item.title = counter.name; 
            
            const img = document.createElement('img');
            img.src = counter.icon;
            
            const span = document.createElement('span');
            span.textContent = counter.name;
            
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'counter-delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCustomCounterType(counter.id);
            });
            
            item.appendChild(img);
            item.appendChild(span);
            item.appendChild(deleteBtn);
            
            item.addEventListener('click', () => {
                if (currentCustomCounterTarget) {
                    if (typeof addCustomCounter === 'function') {
                        addCustomCounter(currentCustomCounterTarget, counter.id);
                        playSe('カウンターを置く.mp3');
                    }
                }
            });
            
            customCounterListContainer.appendChild(item);
        });
    }
}

function openDecorationSettingsModal() {
    if (!decorationSettingsModal) return;
    decorationSettingsModal.style.display = 'flex';
    setupDecorationDropZones();
    
    const isSameUrl = (url1, url2) => {
        if (!url1 || !url2) return false;
        if (url1.startsWith('data:') || url2.startsWith('data:')) {
            return url1 === url2;
        }
        const normalize = (u) => decodeURIComponent(u).split('/').pop().split('?')[0];
        return normalize(url1) === normalize(url2);
    };

    ['player', 'opponent'].forEach(owner => {
        const idPrefix = (owner === 'opponent') ? 'opponent-' : '';
        
        ['deck', 'side-deck', 'grave', 'exclude', 'icon'].forEach(targetType => {
            const column = decorationSettingsModal.querySelector(`.decoration-column[data-target-type="${targetType}"][data-owner="${owner}"]`);
            if (column) {
                const container = column.querySelector('.decoration-stock-container');
                let currentImgSrc = null;
                
                if (targetType === 'icon') {
                    const iconZone = document.getElementById(idPrefix + 'icon-zone');
                    if (iconZone) {
                        const thumb = iconZone.querySelector('.thumbnail');
                        if (thumb) {
                            const img = thumb.querySelector('.card-image');
                            if (img) currentImgSrc = img.src;
                        }
                    }
                } else {
                    const zoneId = idPrefix + targetType;
                    const zone = document.getElementById(zoneId);
                    if (zone) {
                        const slot = zone.querySelector('.card-slot');
                        if (slot) {
                            const decoThumb = slot.querySelector('.thumbnail[data-is-decoration="true"]');
                            if (decoThumb) {
                                const img = decoThumb.querySelector('.card-image');
                                if (img) currentImgSrc = img.src;
                            }
                        }
                    }
                }

                if (!customIconStocks[owner]) customIconStocks[owner] = {};
                if (!customIconStocks[owner][targetType]) customIconStocks[owner][targetType] = [];
                
                let stock = [...customIconStocks[owner][targetType]];
                
                if (currentImgSrc) {
                    const existingIndex = stock.findIndex(src => isSameUrl(src, currentImgSrc));
                    if (existingIndex > -1) {
                        stock.splice(existingIndex, 1);
                    }
                    stock.unshift(currentImgSrc);
                }
                
                let defaults = [];
                if (targetType === 'icon') {
                    defaults = (owner === 'player') ? defaultIconsPlayer : defaultIconsOpponent;
                } else {
                    defaults = defaultDecorations[targetType] || [];
                }

                defaults.forEach(defSrc => {
                    if (!stock.some(s => isSameUrl(s, defSrc))) {
                        stock.push(defSrc);
                    }
                });

                container.innerHTML = '';
                stock.forEach(imgSrc => {
                    addDecorationToStock(imgSrc, targetType, owner, container, false, isSameUrl(imgSrc, currentImgSrc));
                });
                
                customIconStocks[owner][targetType] = stock;
            }
        });
    });
}

function closeDecorationSettingsModal() {
    decorationSettingsModal.style.display = 'none';
}

function setupDecorationDropZones() {
    const dropZones = decorationSettingsModal.querySelectorAll('.decoration-drop-zone');
    dropZones.forEach(zone => {
        if (zone.dataset.listenerAttached) return;
        zone.dataset.listenerAttached = true;

        const column = zone.closest('.decoration-column');
        const targetType = column.dataset.targetType;
        const owner = column.dataset.owner; 

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.style.backgroundColor = '#5a5a7e';
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.style.backgroundColor = '';
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.style.backgroundColor = '';
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    addDecorationToStock(evt.target.result, targetType, owner, column.querySelector('.decoration-stock-container'));
                };
                reader.readAsDataURL(files[0]);
            }
        });

        zone.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            fileInput.onchange = (e) => {
                if (e.target.files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        addDecorationToStock(evt.target.result, targetType, owner, column.querySelector('.decoration-stock-container'));
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            };
            document.body.appendChild(fileInput);
            isFileDialogOpen = true;
            fileInput.click();
            document.body.removeChild(fileInput);
            setTimeout(() => { isFileDialogOpen = false; }, 100);
        });
    });
}

function addDecorationToStock(imageSrc, targetType, owner, container, isNew = true, isCurrent = false) {
    if (isNew) {
        const existingImgs = Array.from(container.querySelectorAll('img'));
        const exists = existingImgs.some(img => img.src === imageSrc);
        if (exists) return;
    }

    const item = document.createElement('div');
    item.className = 'decoration-stock-item';
    item.draggable = true;
    item.dataset.targetType = targetType;
    item.dataset.owner = owner;
    
    if (isCurrent) {
        item.style.borderColor = '#ffcc00';
        item.style.boxShadow = '0 0 5px #ffcc00';
    }
    
    const defaultMemo = `[カード名:-]/#e0e0e0/#555/1.0/非表示/
[属性:-]/#e0e0e0/#555/1.0/非表示/
[マナ:-]/#e0e0e0/#555/1.0/非表示/
[BP:-]/#e0e0e0/#555/1.0/非表示/
[スペル:-]/#e0e0e0/#555/1.0/非表示/
[フレーバーテキスト:-]/#fff/#555/1.0/非表示/
[効果:-]/#e0e0e0/#555/0.7/非表示/`;

    item.dataset.memo = defaultMemo;

    const img = document.createElement('img');
    img.src = imageSrc;
    img.onerror = () => {
        item.remove();
    };
    item.appendChild(img);

    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'decoration-delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        item.remove();
        playSe('ボタン共通.mp3');
        updateZoneDecorationFromStock(targetType, owner, container);
        saveIconStock(targetType, owner, container);
    });
    item.appendChild(deleteBtn);

    item.addEventListener('dragstart', handleStockItemDragStart);
    item.addEventListener('dragover', handleStockItemDragOver);
    item.addEventListener('drop', handleStockItemDrop);
    
    item.addEventListener('contextmenu', (e) => {
        if (typeof handleStockItemContextMenu === 'function') {
            handleStockItemContextMenu(e, item, targetType, owner, container);
        }
    });

    if (isNew) {
        container.insertBefore(item, container.firstChild);
        playSe('ボタン共通.mp3');
        updateZoneDecorationFromStock(targetType, owner, container);
        saveIconStock(targetType, owner, container);
    } else {
        container.appendChild(item);
    }
}

function setDecorationAsTop(item, targetType, owner, container) {
    if (container.firstChild !== item) {
        container.insertBefore(item, container.firstChild);
    }
    updateZoneDecorationFromStock(targetType, owner, container);
    saveIconStock(targetType, owner, container);
    playSe('ボタン共通.mp3');
    
    const allItems = container.querySelectorAll('.decoration-stock-item');
    allItems.forEach(i => {
        i.style.borderColor = '';
        i.style.boxShadow = '';
    });
    item.style.borderColor = '#ffcc00';
    item.style.boxShadow = '0 0 5px #ffcc00';
}

function handleStockItemDragStart(e) {
    draggedStockItem = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
}

function handleStockItemDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleStockItemDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const targetItem = e.currentTarget;
    
    if (draggedStockItem && draggedStockItem !== targetItem && draggedStockItem.parentNode === targetItem.parentNode) {
        const container = targetItem.parentNode;
        const items = Array.from(container.children);
        const fromIndex = items.indexOf(draggedStockItem);
        const toIndex = items.indexOf(targetItem);
        
        if (fromIndex < toIndex) {
            container.insertBefore(draggedStockItem, targetItem.nextSibling);
        } else {
            container.insertBefore(draggedStockItem, targetItem);
        }
        
        const targetType = draggedStockItem.dataset.targetType;
        const owner = draggedStockItem.dataset.owner;
        
        updateZoneDecorationFromStock(targetType, owner, container);
        saveIconStock(targetType, owner, container);
    }
    draggedStockItem = null;
}

function saveIconStock(targetType, owner, container) {
    const items = Array.from(container.querySelectorAll('.decoration-stock-item img'));
    if (!customIconStocks[owner]) customIconStocks[owner] = {};
    customIconStocks[owner][targetType] = items.map(img => img.src);
}

function updateZoneDecorationFromStock(targetType, owner, container) {
    const firstItem = container.querySelector('.decoration-stock-item');
    let imgSrc = null;
    let memo = null;
    
    if (firstItem) {
        imgSrc = firstItem.querySelector('img').src;
        memo = firstItem.dataset.memo;
    } else {
        const defaults = {
            'deck': './decoration/デッキ.png',
            'side-deck': './decoration/EXデッキ.png',
            'grave': './decoration/墓地エリア.png',
            'exclude': './decoration/除外エリア.png',
            'icon': '' 
        };
        imgSrc = defaults[targetType];
    }
    
    const idPrefix = (owner === 'opponent') ? 'opponent-' : '';
    let zoneId = '';
    
    if (targetType === 'icon') {
        zoneId = idPrefix + 'icon-zone';
    } else {
        zoneId = idPrefix + targetType;
    }
    
    const zoneElement = document.getElementById(zoneId);
    if (!zoneElement) return;
    
    if (targetType === 'icon') {
        zoneElement.innerHTML = ''; 
        if (imgSrc) {
             if (typeof createCardThumbnail === 'function') {
                 createCardThumbnail({
                    src: imgSrc,
                    isDecoration: true,
                    memo: memo || '',
                    ownerPrefix: idPrefix
                }, zoneElement, true, false, idPrefix);
             }
        }
    } else {
        const slot = zoneElement.querySelector('.card-slot');
        if (slot) {
            let decorationThumb = slot.querySelector('.thumbnail[data-is-decoration="true"]');
            
            if (imgSrc) {
                if (decorationThumb) {
                    const img = decorationThumb.querySelector('img');
                    if (img) img.src = imgSrc;
                } else {
                    if (typeof createCardThumbnail === 'function') {
                        createCardThumbnail(imgSrc, slot, true, false, idPrefix);
                    }
                }
            } else {
                if (decorationThumb) decorationThumb.remove();
            }
            
            if (typeof syncMainZoneImage === 'function') {
                syncMainZoneImage(targetType, idPrefix);
            }
        }
    }
}

function closeLightbox() {
    if (lightboxOverlay) {
        lightboxOverlay.classList.remove('show');
    }
    if (lightboxContent) {
        lightboxContent.innerHTML = '';
    }
}

function openIllustrationViewer(thumbnailElement) {
    if (!thumbnailElement || typeof lightboxContent === 'undefined' || typeof lightboxOverlay === 'undefined') {
        return;
    }

    const previewImg = thumbnailElement.querySelector('img');
    const mainImgSrc = (previewImg && previewImg.src) ? (thumbnailElement.dataset.originalSrc || previewImg.src) : null;
    const flavor1Src = thumbnailElement.dataset.flavor1;
    const flavor2Src = thumbnailElement.dataset.flavor2;

    lightboxContent.innerHTML = '';
    let imagesAdded = 0;
    [mainImgSrc, flavor1Src, flavor2Src].forEach(src => {
        if (src) {
            const img = document.createElement('img');
            img.src = src;
            lightboxContent.appendChild(img);
            imagesAdded++;
        }
    });
    if (imagesAdded > 0) {
        lightboxOverlay.classList.add('show');
    }
}

function setupModalEvents() {
    if (lightboxOverlay) {
        lightboxOverlay.addEventListener('click', (e) => closeLightbox());
    }
    if (lightboxContent) {
        lightboxContent.addEventListener('click', (e) => {
            if (e.target === lightboxContent) {
                closeLightbox();
            }
        });
    }

    if (memoTextarea) {
        memoTextarea.addEventListener('input', () => {
            if (currentMemoTarget) {
                currentMemoTarget.dataset.memo = memoTextarea.value;
                if (typeof window.updateCardPreview === 'function') {
                    window.updateCardPreview(currentMemoTarget);
                }
            }
        });
    }
    
    [memoFontSizeInput, memoWidthInput, memoHeightInput].forEach(input => {
        if(input) input.addEventListener('input', updateMemoEditorStyle);
    });

    if (memoSaveBtn) {
        memoSaveBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            performMemoSave();
        });
    }
    if (memoCancelBtn) {
        memoCancelBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            performMemoCancel();
        });
    }
    
    document.addEventListener('mousemove', (e) => {
        if (memoTooltip && memoTooltip.style.display === 'block') {
            memoTooltip.style.left = (e.pageX + 10) + 'px';
            memoTooltip.style.top = (e.pageY + 10) + 'px';
            const rect = memoTooltip.getBoundingClientRect();
            if (rect.right > window.innerWidth) memoTooltip.style.left = (e.pageX - rect.width - 10) + 'px';
            if (rect.bottom > window.innerHeight) memoTooltip.style.top = (e.pageY - rect.height - 10) + 'px';
        }
    });

    if (flavorCancelBtn) {
        flavorCancelBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            closeFlavorEditor();
        });
    }
    if(flavorSaveBtn) {
        flavorSaveBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            closeFlavorEditor();
        });
    }
    
    if (flavorDelete1) {
        flavorDelete1.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            deleteFlavorImage(1);
        });
    }
    if (flavorDelete2) {
        flavorDelete2.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            deleteFlavorImage(2);
        });
    }
    if (flavorUpload1) {
        flavorUpload1.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            openFlavorFileInput(1);
        });
    }
    if (flavorUpload2) {
        flavorUpload2.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            openFlavorFileInput(2);
        });
    }
    
    if (flavorDropZone1) {
        flavorDropZone1.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); flavorDropZone1.classList.remove('drag-over'); const files = e.dataTransfer.files; if (files.length > 0) handleFlavorFile(files[0], 1); });
        flavorDropZone1.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); flavorDropZone1.classList.add('drag-over'); });
        flavorDropZone1.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); flavorDropZone1.classList.remove('drag-over'); });
        flavorDropZone1.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            openFlavorFileInput(1);
        });
    }
    if (flavorDropZone2) {
        flavorDropZone2.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); flavorDropZone2.classList.remove('drag-over'); const files = e.dataTransfer.files; if (files.length > 0) handleFlavorFile(files[0], 2); });
        flavorDropZone2.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); flavorDropZone2.classList.add('drag-over'); });
        flavorDropZone2.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); flavorDropZone2.classList.remove('drag-over'); });
        flavorDropZone2.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            openFlavorFileInput(2);
        });
    }
    
    if (customCounterCloseBtn) {
        customCounterCloseBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            closeCustomCounterModal();
        });
    }
    if(customCounterSaveBtn) {
        customCounterSaveBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            closeCustomCounterModal();
        });
    }
    
    if (createCounterBtn) {
        createCounterBtn.addEventListener('click', () => {
            createNewCustomCounterType();
        });
    }
    if (newCounterImageDrop) {
        newCounterImageDrop.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); newCounterImageDrop.classList.add('drag-over'); });
        newCounterImageDrop.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); newCounterImageDrop.classList.remove('drag-over'); });
        newCounterImageDrop.addEventListener('drop', (e) => {
            e.preventDefault(); e.stopPropagation();
            newCounterImageDrop.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) handleNewCounterImageFile(files[0]);
        });
        newCounterImageDrop.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            fileInput.onchange = (e) => {
                if (e.target.files.length > 0) handleNewCounterImageFile(e.target.files[0]);
            };
            document.body.appendChild(fileInput);
            isFileDialogOpen = true;
            fileInput.click();
            document.body.removeChild(fileInput);
            setTimeout(() => { isFileDialogOpen = false; }, 100);
        });
    }

    if (decorationSettingsCloseBtn) {
        decorationSettingsCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            playSe('ボタン共通.mp3');
            closeDecorationSettingsModal();
        });
    }
    
    if (typeof makeDraggable === 'function') {
        if (memoEditorHeader && memoEditorModal) makeDraggable(memoEditorHeader, memoEditorModal);
        if (decorationSettingsHeader && decorationSettingsModal) makeDraggable(decorationSettingsHeader, decorationSettingsModal);
        if (flavorEditorHeader && flavorEditorModal) makeDraggable(flavorEditorHeader, flavorEditorModal);
        
        if (customCounterModal) {
            const customCounterHeader = customCounterModal.querySelector('.custom-counter-header');
            if(customCounterHeader) makeDraggable(customCounterHeader, customCounterModal);
        }
    }
}