document.addEventListener('DOMContentLoaded', () => {

    setupUI();

    const commonPreviewArea = document.getElementById('common-card-preview');
    
    if (commonPreviewArea) {
        commonPreviewArea.addEventListener('click', () => {
            const previewImg = commonPreviewArea.querySelector('img');
            const mainImgSrc = (previewImg && previewImg.src) ? previewImg.src : null;
            const flavor1Src = commonPreviewArea.dataset.flavor1;
            const flavor2Src = commonPreviewArea.dataset.flavor2;

            if (typeof lightboxContent !== 'undefined' && typeof lightboxOverlay !== 'undefined') {
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
        });
    }

    initializeBoard('.player-wrapper', '');
    initializeBoard('.opponent-wrapper', 'opponent-');

    setTimeout(async () => {
        const playerDeckContainer = document.getElementById('deck-back-slots');
        const hasCards = playerDeckContainer ? playerDeckContainer.querySelectorAll('.thumbnail').length > 0 : false;

        if (typeof window.validSampleDecks === 'undefined') {
            window.validSampleDecks = [];
        }

        const loadPromises = [];
        for (let i = 1; i <= 8; i++) {
            loadPromises.push(
                fetch(`sample/sample_deck_${i}.json`)
                    .then(response => {
                        if (response.ok) return response.json();
                        throw new Error(`Sample deck ${i} not found`);
                    })
                    .then(data => {
                        window.validSampleDecks.push(data);
                    })
                    .catch(() => {
                    })
            );
        }

        await Promise.all(loadPromises);

        if (!hasCards && window.validSampleDecks.length > 0) {
            const randomIndex = Math.floor(Math.random() * window.validSampleDecks.length);
            const data = window.validSampleDecks[randomIndex];

            if (typeof clearZoneData === 'function') {
                clearZoneData('deck-back-slots');
                clearZoneData('side-deck-back-slots');
                clearZoneData('free-space-slots');
                clearZoneData('token-zone-slots');
            }
            
            if (typeof applyDataToZone === 'function') {
                if (data.deck) applyDataToZone('deck-back-slots', data.deck);
                if (data.sideDeck) applyDataToZone('side-deck-back-slots', data.sideDeck);
                if (data.freeSpace) applyDataToZone('free-space-slots', data.freeSpace);
                if (data.token) applyDataToZone('token-zone-slots', data.token);
            }
            
            if (typeof syncMainZoneImage === 'function') {
                syncMainZoneImage('deck', '');
                syncMainZoneImage('side-deck', '');
            }
            
            if (typeof window.updatePlaymatState === 'function') {
                window.updatePlaymatState();
            }
        } else if (!hasCards) {
            console.warn("有効なサンプルデッキが見つかりませんでした。");
        }
    }, 500); 

});