// ScalTech CutList - Core Application Logic
// Handles bin-packing optimization, multi-source stock management, canvas visualizer with cut piece toggling, and workshop print reports.

// --- Global State ---
let availableSources = [
    { id: 1, length: 6000, count: 5 }
];

let itemsToCut = [];

// Set of cut piece IDs marked as completed / already cut
let completedCutIds = new Set();

// Hit-testing bounding boxes for canvas click detection
let canvasBoundingBoxes = [];

// Color palette for cut pieces in visualizer
const COLOR_PALETTE = [
    { start: '#38bdf8', end: '#0284c7' }, // Cyan
    { start: '#818cf8', end: '#4f46e5' }, // Indigo
    { start: '#34d399', end: '#059669' }, // Emerald
    { start: '#fbbf24', end: '#d97706' }, // Amber
    { start: '#f472b6', end: '#db2777' }, // Pink
    { start: '#a78bfa', end: '#7c3aed' }, // Purple
    { start: '#2dd4bf', end: '#0d9488' }  // Teal
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Render initial source profiles
    renderSourceProfilesDOM();
    updateItemListDOM();

    // Attach canvas click and mousemove listeners for interactive cut toggling
    initCanvasInteractions();

    // Enable drag and drop file import for workshop machinist
    initDragAndDrop();

    // Auto-load sample data on first visit
    loadSampleData();

    // Resize event listener for responsive canvas redraw
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(runOptimization, 100);
    });

    // ResizeObserver on output column to immediately adapt when leaving/entering fullscreen or window resize
    if (window.ResizeObserver) {
        const outputCol = document.querySelector('.output-column');
        if (outputCol) {
            let roTimer;
            const ro = new ResizeObserver(() => {
                clearTimeout(roTimer);
                roTimer = setTimeout(() => {
                    runOptimization();
                }, 30);
            });
            ro.observe(outputCol);
        }
    }
});

// --- Canvas Interactions (Click & Hover) ---
function initCanvasInteractions() {
    const canvas = document.getElementById('visualizationCanvas');
    if (!canvas) return;

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Find clicked item box
        const hit = canvasBoundingBoxes.find(b =>
            mouseX >= b.x && mouseX <= b.x + b.width &&
            mouseY >= b.y && mouseY <= b.y + b.height
        );

        if (hit) {
            toggleCutCompleted(hit.id);
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const hit = canvasBoundingBoxes.find(b =>
            mouseX >= b.x && mouseX <= b.x + b.width &&
            mouseY >= b.y && mouseY <= b.y + b.height
        );

        canvas.style.cursor = hit ? 'pointer' : 'default';
    });
}

function toggleCutCompleted(id) {
    if (completedCutIds.has(id)) {
        completedCutIds.delete(id);
    } else {
        completedCutIds.add(id);
    }
    runOptimization();
}

function resetCutProgress() {
    completedCutIds.clear();
    runOptimization();
}

// --- Source Profiles Management ---
function renderSourceProfilesDOM() {
    const container = document.getElementById('sourceProfileList');
    if (!container) return;

    container.innerHTML = '';

    availableSources.forEach((src) => {
        const row = document.createElement('div');
        row.className = 'source-profile-group';
        row.innerHTML = `
            <div class="input-group">
                <label for="srcLen_${src.id}">Długość (mm)</label>
                <input type="number" id="srcLen_${src.id}" value="${src.length}" min="100" step="10" 
                    oninput="updateSourceProfile(${src.id}, 'length', this.value)">
            </div>
            <div class="input-group">
                <label for="srcCnt_${src.id}">Ilość (szt.)</label>
                <input type="number" id="srcCnt_${src.id}" value="${src.count}" min="1" step="1" 
                    oninput="updateSourceProfile(${src.id}, 'count', this.value)">
            </div>
            ${availableSources.length > 1 ? `
                <button type="button" class="btn-danger-icon" onclick="removeSourceProfile(${src.id})" title="Usuń profil">✕</button>
            ` : ''}
        `;
        container.appendChild(row);
    });
}

function addSourceProfile() {
    const newId = Date.now();
    availableSources.push({ id: newId, length: 6000, count: 5 });
    renderSourceProfilesDOM();
    runOptimization();
}

function addSourceProfileWithValues(length, count) {
    const existing = availableSources.find(s => s.length === length);
    if (existing) {
        existing.count += count;
    } else {
        availableSources.push({ id: Date.now(), length, count });
    }
    renderSourceProfilesDOM();
    runOptimization();
}

function removeSourceProfile(id) {
    if (availableSources.length <= 1) return;
    availableSources = availableSources.filter(s => s.id !== id);
    renderSourceProfilesDOM();
    runOptimization();
}

function updateSourceProfile(id, field, value) {
    const src = availableSources.find(s => s.id === id);
    if (!src) return;
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
        src[field] = num;
        runOptimization();
    }
}

// --- Cut List Items Management ---
function addItemToItems() {
    const lengthInput = document.getElementById('newItemLength');
    const quantityInput = document.getElementById('newItemQuantity');
    const labelInput = document.getElementById('newItemLabel');

    const length = parseFloat(lengthInput.value);
    const quantity = parseInt(quantityInput.value, 10);
    const label = labelInput.value.trim();

    if (isNaN(length) || length <= 0) {
        alert("Wprowadź prawidłową długość elementu (większą od 0 mm).");
        lengthInput.focus();
        return;
    }
    if (isNaN(quantity) || quantity <= 0) {
        alert("Wprowadź prawidłową ilość sztuk.");
        quantityInput.focus();
        return;
    }

    const existing = itemsToCut.find(i => i.length === length && i.label === label);
    if (existing) {
        existing.quantity += quantity;
    } else {
        itemsToCut.push({
            id: Date.now(),
            length: length,
            quantity: quantity,
            label: label || `Poz. #${itemsToCut.length + 1}`
        });
    }

    lengthInput.value = '';
    quantityInput.value = '1';
    labelInput.value = '';
    lengthInput.focus();

    updateItemListDOM();
    runOptimization();
}

function updateItemQuantity(index, delta) {
    if (index >= 0 && index < itemsToCut.length) {
        itemsToCut[index].quantity += delta;
        if (itemsToCut[index].quantity <= 0) {
            itemsToCut.splice(index, 1);
        }
        updateItemListDOM();
        runOptimization();
    }
}

function removeItemFromItems(index) {
    if (index >= 0 && index < itemsToCut.length) {
        itemsToCut.splice(index, 1);
        updateItemListDOM();
        runOptimization();
    }
}

function updateItemListDOM() {
    const container = document.getElementById('itemList');
    const badge = document.getElementById('totalItemsBadge');
    if (!container) return;

    container.innerHTML = '';

    const totalCount = itemsToCut.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) badge.textContent = `${totalCount} szt.`;

    if (itemsToCut.length === 0) {
        container.innerHTML = `
            <div class="empty-msg">
                Brak elementów na liście.<br>Użyj formularza powyżej lub kliknij <strong>"Przykładowe Dane"</strong>.
            </div>
        `;
        return;
    }

    itemsToCut.forEach((item, index) => {
        const colorObj = COLOR_PALETTE[index % COLOR_PALETTE.length];
        const card = document.createElement('div');
        card.className = 'item-badge-card';
        card.innerHTML = `
            <div class="item-info">
                <span class="item-length-tag" style="color: ${colorObj.start}">${item.length} mm</span>
                <span class="item-qty-tag">x${item.quantity}</span>
                ${item.label ? `<span class="item-label-tag">${escapeHtml(item.label)}</span>` : ''}
            </div>
            <div class="item-controls">
                <button type="button" class="btn-qty" onclick="updateItemQuantity(${index}, -1)" title="Zmniejsz ilość">-</button>
                <button type="button" class="btn-qty" onclick="updateItemQuantity(${index}, 1)" title="Zwiększ ilość">+</button>
                <button type="button" class="btn-danger-icon" style="width:28px; height:28px;" onclick="removeItemFromItems(${index})" title="Usuń item">✕</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function loadSampleData() {
    availableSources = [
        { id: 1, length: 6000, count: 10 }
    ];
    itemsToCut = [
        { id: 101, length: 1450, quantity: 4, label: 'Rama Górna' },
        { id: 102, length: 2100, quantity: 4, label: 'Noga Główna' },
        { id: 103, length: 850, quantity: 6, label: 'Wzmocnienie Boczny' },
        { id: 104, length: 1200, quantity: 3, label: 'Poprzeczka Dolna' }
    ];
    completedCutIds.clear();
    renderSourceProfilesDOM();
    updateItemListDOM();
    runOptimization();
}

function clearAllData() {
    if (confirm("Czy na pewno chcesz wyczyścić wszystkie wprowadzone dane?")) {
        itemsToCut = [];
        availableSources = [{ id: 1, length: 6000, count: 5 }];
        completedCutIds.clear();
        const ct = document.getElementById('cutThickness');
        if (ct) ct.value = "1.5";
        const et = document.getElementById('edgeTrim');
        if (et) et.value = "0";
        renderSourceProfilesDOM();
        updateItemListDOM();
        runOptimization();
    }
}

// --- Optimization Engine ---
function runOptimization() {
    const cutThickness = parseFloat(document.getElementById('cutThickness')?.value) || 0;
    const edgeTrim = parseFloat(document.getElementById('edgeTrim')?.value) || 0;
    const algo = document.getElementById('algoSelect')?.value || 'FFD';

    const warningBanner = document.getElementById('warningBanner');
    const warningText = document.getElementById('warningText');
    if (warningBanner) warningBanner.classList.add('hidden');

    if (itemsToCut.length === 0) {
        updateStats(0, 0, 0, 0, 0);
        clearCanvas();
        renderWorkshopCutPlan([]);
        return;
    }

    // 1. Flatten required items into individual cut pieces
    let flatItems = [];
    itemsToCut.forEach((group, groupIdx) => {
        for (let i = 0; i < group.quantity; i++) {
            flatItems.push({
                id: `${group.id}_${i}`,
                length: group.length,
                label: group.label || `Poz. #${groupIdx + 1}`,
                groupIdx: groupIdx
            });
        }
    });

    // 2. Sort pieces descending by length
    flatItems.sort((a, b) => b.length - a.length);

    // 3. Prepare inventory pool of source profiles
    let inventory = [];
    availableSources.forEach(src => {
        for (let i = 0; i < src.count; i++) {
            inventory.push({
                stockLength: src.length,
                usableLength: src.length - (2 * edgeTrim)
            });
        }
    });

    inventory.sort((a, b) => b.stockLength - a.stockLength);

    const maxCapacity = Math.max(...availableSources.map(s => s.length - (2 * edgeTrim)));
    const invalidPiece = flatItems.find(p => p.length > maxCapacity);
    if (invalidPiece) {
        showErrorOnCanvas(`Błąd: Element ${invalidPiece.length}mm (${invalidPiece.label}) jest dłuższy niż największy profil z uwzględnieniem marginesu (${maxCapacity}mm)!`);
        updateStats(0, 0, 0, 0, 0);
        renderWorkshopCutPlan([]);
        return;
    }

    // 4. Bin Packing
    let openBins = [];
    let unplacedItems = [];

    flatItems.forEach(piece => {
        let bestBinIndex = -1;

        if (algo === 'BFD') {
            let minRemainingAfter = Infinity;
            for (let i = 0; i < openBins.length; i++) {
                const b = openBins[i];
                const kerf = b.items.length > 0 ? cutThickness : 0;
                const needed = piece.length + kerf;
                if (b.remaining >= needed) {
                    const remAfter = b.remaining - needed;
                    if (remAfter < minRemainingAfter) {
                        minRemainingAfter = remAfter;
                        bestBinIndex = i;
                    }
                }
            }
        } else {
            for (let i = 0; i < openBins.length; i++) {
                const b = openBins[i];
                const kerf = b.items.length > 0 ? cutThickness : 0;
                const needed = piece.length + kerf;
                if (b.remaining >= needed) {
                    bestBinIndex = i;
                    break;
                }
            }
        }

        if (bestBinIndex !== -1) {
            const bin = openBins[bestBinIndex];
            const kerf = bin.items.length > 0 ? cutThickness : 0;
            bin.items.push(piece);
            bin.remaining -= (piece.length + kerf);
        } else {
            if (inventory.length > 0) {
                let stockIdx = -1;
                for (let s = inventory.length - 1; s >= 0; s--) {
                    if (inventory[s].usableLength >= piece.length) {
                        stockIdx = s;
                        break;
                    }
                }
                if (stockIdx === -1) stockIdx = 0;

                const chosenStock = inventory.splice(stockIdx, 1)[0];
                const newBin = {
                    stockLength: chosenStock.stockLength,
                    usableCapacity: chosenStock.usableLength,
                    edgeTrim: edgeTrim,
                    remaining: chosenStock.usableLength - piece.length,
                    items: [piece]
                };
                openBins.push(newBin);
            } else {
                const primaryStock = availableSources[0]?.length || 6000;
                const newBin = {
                    stockLength: primaryStock,
                    usableCapacity: primaryStock - (2 * edgeTrim),
                    edgeTrim: edgeTrim,
                    remaining: (primaryStock - (2 * edgeTrim)) - piece.length,
                    items: [piece],
                    isExtra: true
                };
                openBins.push(newBin);
                unplacedItems.push(piece);
            }
        }
    });

    if (unplacedItems.length > 0 && warningBanner && warningText) {
        warningBanner.classList.remove('hidden');
        warningText.textContent = `Brakowało wystarczającej ilości materiału dla ${unplacedItems.length} elementów. Wyliczono dodatkowe profile na podstawie domyślnego wymiaru. Dodaj więcej sztuk w profilach źródłowych!`;
    }

    // 5. Calculate statistics
    const totalCutPiecesLength = flatItems.reduce((sum, p) => sum + p.length, 0);
    const totalStockLengthUsed = openBins.reduce((sum, b) => sum + b.stockLength, 0);
    const totalCutsCount = flatItems.length + (openBins.length * (edgeTrim > 0 ? 2 : 0));
    const totalWaste = totalStockLengthUsed - totalCutPiecesLength;
    const efficiency = totalStockLengthUsed > 0 ? (totalCutPiecesLength / totalStockLengthUsed) * 100 : 0;

    updateStats(totalStockLengthUsed, efficiency, totalWaste, totalCutsCount, openBins.length);
    drawVisualization(openBins, cutThickness, edgeTrim);
    renderWorkshopCutPlan(openBins, cutThickness, edgeTrim);
    updateInputsSummaryDOM();
}

// --- Stats & UI Updates ---
function updateStats(stockUsed, efficiency, waste, cuts, blocks) {
    const stockEl = document.getElementById('totalLengthDisplay');
    const effEl = document.getElementById('efficiencyResult');
    const wasteEl = document.getElementById('wasteResult');
    const cutsEl = document.getElementById('cutCountResult');
    const blocksEl = document.getElementById('blocksUsedResult');

    if (stockEl) stockEl.textContent = stockUsed.toLocaleString('pl-PL');
    if (effEl) effEl.textContent = `${efficiency.toFixed(1)}%`;
    if (wasteEl) wasteEl.textContent = `${waste.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} mm`;
    if (cutsEl) cutsEl.textContent = cuts;
    if (blocksEl) blocksEl.textContent = `${blocks} szt.`;
}

// --- Canvas Visualizer ---
function clearCanvas() {
    const canvas = document.getElementById('visualizationCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvasBoundingBoxes = [];
}

function showErrorOnCanvas(msg) {
    const canvas = document.getElementById('visualizationCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 140 * dpr;
    canvas.style.height = '140px';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, 140);
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg, rect.width / 2, 70);
    canvasBoundingBoxes = [];
}

function drawVisualization(bins, cutThickness, edgeTrim) {
    const canvas = document.getElementById('visualizationCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Reset canvas style width to 100% so it never forces parent container to stay stretched
    canvas.style.width = '100%';

    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement || document.getElementById('canvasWrapper');
    const containerWidth = container ? container.clientWidth : 0;
    const canvasWidth = Math.max(containerWidth, 280);

    const paddingX = Math.min(20, Math.max(10, Math.floor(canvasWidth * 0.025)));
    const paddingY = 18;
    const binHeight = 44;
    const binGap = 34;
    const labelHeight = 20;

    const totalHeight = paddingY * 2 + bins.length * (binHeight + binGap + labelHeight);

    canvas.width = canvasWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = '100%';
    canvas.style.height = `${totalHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvasWidth, totalHeight);

    canvasBoundingBoxes = []; // Reset hit boxes

    const maxStockLength = Math.max(...bins.map(b => b.stockLength), 1);
    const drawableWidth = canvasWidth - (paddingX * 2);

    bins.forEach((bin, bIdx) => {
        const scale = drawableWidth / maxStockLength;
        const currentBinWidth = bin.stockLength * scale;
        const y = paddingY + bIdx * (binHeight + binGap + labelHeight) + labelHeight;

        // Draw Profile Header Label
        ctx.fillStyle = bin.isExtra ? '#fbbf24' : '#38bdf8';
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`PROFIL #${bIdx + 1} (${bin.stockLength} mm)${bin.isExtra ? ' - BRAK STOCKU!' : ''}`, paddingX, y - 8);

        // Draw Waste Info Right
        ctx.textAlign = 'right';
        ctx.fillStyle = bin.remaining > 50 ? '#94a3b8' : '#f87171';
        ctx.font = '500 11px Inter, sans-serif';
        ctx.fillText(`Odpad: ${bin.remaining.toFixed(1)} mm`, paddingX + currentBinWidth, y - 8);

        // Draw Stock Bar Background
        ctx.fillStyle = '#0f172a';
        drawRoundRect(ctx, paddingX, y, currentBinWidth, binHeight, 8);
        ctx.fill();
        ctx.strokeStyle = '#2a3752';
        ctx.lineWidth = 1;
        ctx.stroke();

        let currentX = paddingX;

        // Draw Edge Trim (Start)
        if (edgeTrim > 0) {
            const trimW = edgeTrim * scale;
            ctx.fillStyle = 'rgba(248, 113, 113, 0.2)';
            ctx.fillRect(currentX, y, trimW, binHeight);
            currentX += trimW;
        }

        // Draw Cut Pieces
        bin.items.forEach((item, iIdx) => {
            const itemW = item.length * scale;
            const isCompleted = completedCutIds.has(item.id);

            // Record bounding box for interactive clicking in CSS coordinates
            canvasBoundingBoxes.push({
                x: currentX,
                y: y + 3,
                width: itemW,
                height: binHeight - 6,
                id: item.id
            });

            if (isCompleted) {
                // Grayed out cut piece styling
                const grayGrad = ctx.createLinearGradient(currentX, y, currentX, y + binHeight);
                grayGrad.addColorStop(0, '#334155');
                grayGrad.addColorStop(1, '#1e293b');

                ctx.fillStyle = grayGrad;
                drawRoundRect(ctx, currentX, y + 3, itemW, binHeight - 6, 6);
                ctx.fill();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Checkmark Text
                if (itemW > 20) {
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = 'bold 11px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`✓ ${item.length}`, currentX + (itemW / 2), y + (binHeight / 2) + 4);
                }
            } else {
                // Normal vibrant piece styling
                const colorObj = COLOR_PALETTE[item.groupIdx % COLOR_PALETTE.length];
                const gradient = ctx.createLinearGradient(currentX, y, currentX, y + binHeight);
                gradient.addColorStop(0, colorObj.start);
                gradient.addColorStop(1, colorObj.end);

                ctx.fillStyle = gradient;
                drawRoundRect(ctx, currentX, y + 3, itemW, binHeight - 6, 6);
                ctx.fill();

                if (itemW > 24) {
                    ctx.fillStyle = '#0b0f19';
                    ctx.font = 'bold 11px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${item.length}`, currentX + (itemW / 2), y + (binHeight / 2) + 4);
                }
            }

            currentX += itemW;

            // Draw Cut Kerf line
            if (iIdx < bin.items.length - 1) {
                const kerfW = Math.max(2, cutThickness * scale);
                ctx.fillStyle = '#f472b6';
                ctx.fillRect(currentX, y + 2, kerfW, binHeight - 4);
                currentX += (cutThickness * scale);
            }
        });

        // Draw Edge Trim (End)
        if (edgeTrim > 0) {
            const trimW = edgeTrim * scale;
            const endTrimX = paddingX + currentBinWidth - trimW;
            ctx.fillStyle = 'rgba(248, 113, 113, 0.2)';
            ctx.fillRect(endTrimX, y, trimW, binHeight);
        }
    });
}

function drawRoundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

// --- Workshop Cut Plan Table Generator ---
function renderWorkshopCutPlan(bins, cutThickness, edgeTrim) {
    const container = document.getElementById('cutPlanDetails');
    const badge = document.getElementById('cutProgressBadge');
    if (!container) return;

    container.innerHTML = '';

    // Calculate total cut pieces & completed count
    let totalPieces = 0;
    let completedCount = 0;

    bins.forEach(bin => {
        bin.items.forEach(it => {
            totalPieces++;
            if (completedCutIds.has(it.id)) completedCount++;
        });
    });

    const percent = totalPieces > 0 ? Math.round((completedCount / totalPieces) * 100) : 0;
    if (badge) badge.textContent = `Postęp: ${completedCount} / ${totalPieces} szt. (${percent}%)`;

    if (bins.length === 0) {
        container.innerHTML = `<p class="empty-msg">Dodaj elementy do cięcia, aby wygenerować szczegółowy plan cięcia.</p>`;
        return;
    }

    bins.forEach((bin, idx) => {
        const card = document.createElement('div');
        card.className = 'profile-plan-card';

        let itemsMarkup = bin.items.map((it) => {
            const isCompleted = completedCutIds.has(it.id);
            return `
                <span class="chip-item ${isCompleted ? 'completed' : ''}" onclick="toggleCutCompleted('${it.id}')" title="Kliknij, aby zmienić stan cięcia">
                    <strong>${it.length} mm</strong> ${it.label ? `(${escapeHtml(it.label)})` : ''}
                </span>
            `;
        }).join('');

        if (edgeTrim > 0) {
            itemsMarkup = `<span class="chip-waste" style="background:rgba(251,191,36,0.15); color:#fbbf24;">Margines ${edgeTrim}mm</span>` + itemsMarkup;
        }

        itemsMarkup += `<span class="chip-waste">Odpad: ${bin.remaining.toFixed(1)} mm</span>`;

        card.innerHTML = `
            <div class="profile-plan-title">
                <span>Profil #${idx + 1} — Sztuk: 1 — Długość: ${bin.stockLength} mm</span>
                <span>Liczba cięć: ${bin.items.length}</span>
            </div>
            <div class="cut-items-chips">
                ${itemsMarkup}
            </div>
        `;
        container.appendChild(card);
    });
}

function copyCutPlanToClipboard() {
    const textPlan = document.getElementById('cutPlanDetails')?.innerText;
    if (!textPlan) return;

    navigator.clipboard.writeText(textPlan).then(() => {
        alert("📋 Plan cięcia został skopiowany do schowka!");
    }).catch(err => {
        console.error("Failed to copy", err);
    });
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// --- Inputs Collapse & Fullscreen Controls (Optimized for Vertical 16:9 / Workshop Screens) ---
let isInputsCollapsed = false;

function toggleInputsCollapse() {
    isInputsCollapsed = !isInputsCollapsed;
    const appGrid = document.querySelector('.app-grid');
    const inputCol = document.querySelector('.input-column');
    const summaryBar = document.getElementById('inputsSummaryBar');
    if (!inputCol || !summaryBar) return;

    if (isInputsCollapsed) {
        updateInputsSummaryDOM();
        inputCol.classList.add('collapsed');
        if (appGrid) appGrid.classList.add('inputs-collapsed');
        summaryBar.classList.remove('hidden');
    } else {
        inputCol.classList.remove('collapsed');
        if (appGrid) appGrid.classList.remove('inputs-collapsed');
        summaryBar.classList.add('hidden');
    }

    // Trigger canvas redraw to adapt to the new layout/width
    setTimeout(() => {
        runOptimization();
    }, 60);
}

function updateInputsSummaryDOM() {
    const summaryInfo = document.getElementById('inputsSummaryInfo');
    if (!summaryInfo) return;

    const totalSources = availableSources.reduce((sum, s) => sum + s.count, 0);
    const totalItems = itemsToCut.reduce((sum, i) => sum + i.quantity, 0);
    const cutThickness = document.getElementById('cutThickness')?.value || 1.5;
    const edgeTrim = document.getElementById('edgeTrim')?.value || 0;

    const sourcesDesc = availableSources.map(s => `${s.length} mm (${s.count} szt.)`).join(', ');

    summaryInfo.innerHTML = `
        <div class="summary-item">
            <span>📦 Profile:</span>
            <strong>${sourcesDesc || `${totalSources} szt.`}</strong>
        </div>
        <div class="summary-item">
            <span>✂️ Elementy:</span>
            <strong>${totalItems} szt. (${itemsToCut.length} pozycji)</strong>
        </div>
        <div class="summary-item">
            <span>📏 Rzaz:</span>
            <strong>${cutThickness} mm</strong>
        </div>
        ${edgeTrim > 0 ? `
        <div class="summary-item">
            <span>Margines:</span>
            <strong>${edgeTrim} mm</strong>
        </div>
        ` : ''}
    `;
}

let isAppFullscreen = false;

function toggleFullscreen() {
    isAppFullscreen = !isAppFullscreen;
    const body = document.body;
    const btn = document.getElementById('btnToggleFullscreen');

    if (isAppFullscreen) {
        body.classList.add('fullscreen-mode');
        if (btn) btn.innerHTML = '🗗 Opuść Pełny Ekran';

        // Try standard or prefixed browser fullscreen
        const docEl = document.documentElement;
        const requestMethod = docEl.requestFullscreen || 
                              docEl.webkitRequestFullscreen || 
                              docEl.mozRequestFullScreen || 
                              docEl.msRequestFullscreen;
        if (requestMethod && !document.fullscreenElement && !document.webkitFullscreenElement) {
            try {
                const res = requestMethod.call(docEl);
                if (res && res.catch) res.catch(() => {});
            } catch (err) {
                console.log("Browser fullscreen blocked; active in-app fullscreen mode instead", err);
            }
        }
    } else {
        body.classList.remove('fullscreen-mode');
        if (btn) btn.innerHTML = '⛶ Pełny Ekran';

        const exitMethod = document.exitFullscreen || 
                           document.webkitExitFullscreen || 
                           document.mozCancelFullScreen || 
                           document.msExitFullscreen;
        if (exitMethod && (document.fullscreenElement || document.webkitFullscreenElement)) {
            try {
                const res = exitMethod.call(document);
                if (res && res.catch) res.catch(() => {});
            } catch (err) {}
        }
    }

    // Trigger canvas redraw with updated dimensions across transition
    runOptimization();
    setTimeout(runOptimization, 50);
    setTimeout(runOptimization, 200);
}

// Keep button text in sync if user exits native fullscreen via Esc key or F11
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(ev => {
    document.addEventListener(ev, () => {
        const isNative = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (!isNative && isAppFullscreen) {
            isAppFullscreen = false;
            document.body.classList.remove('fullscreen-mode');
            const btn = document.getElementById('btnToggleFullscreen');
            if (btn) btn.innerHTML = '⛶ Pełny Ekran';
            runOptimization();
            setTimeout(runOptimization, 50);
            setTimeout(runOptimization, 200);
        }
    });
});

// --- File Transfer & Project Export/Import (Office to Workshop / Biuro do Warsztatu) ---

function getProjectDataJSON() {
    const cutThickness = parseFloat(document.getElementById('cutThickness')?.value) || 1.5;
    const edgeTrim = parseFloat(document.getElementById('edgeTrim')?.value) || 0;
    const algorithm = document.getElementById('algoSelect')?.value || "FFD";

    const projectData = {
        app: "ScalTech CutList",
        version: "1.2",
        exportedAt: new Date().toISOString(),
        settings: {
            cutThickness: cutThickness,
            edgeTrim: edgeTrim,
            algorithm: algorithm
        },
        availableSources: availableSources,
        itemsToCut: itemsToCut,
        completedCutIds: Array.from(completedCutIds)
    };
    return JSON.stringify(projectData, null, 2);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// 1. Zapis projektu do pliku .cutlist (do przesłania maszyniście)
function exportProjectFile() {
    if (itemsToCut.length === 0) {
        alert("Lista elementów do cięcia jest pusta. Dodaj elementy przed eksportem.");
        return;
    }
    const projectJson = getProjectDataJSON();
    const blob = new Blob([projectJson], { type: 'application/json' });
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `Rozpiska_ScalTech_${dateStr}_${timeStr}.cutlist`;
    downloadBlob(blob, filename);
    showNotification(`💾 Zapisano plik projektu: ${filename}. Możesz przesłać go maszyniście.`);
}

// 2. Eksport do obrazu PNG ze schematem cięcia i zaszytymi danymi projektu
function exportVisualizerPNG() {
    const canvas = document.getElementById('visualizationCanvas');
    if (!canvas || itemsToCut.length === 0) {
        alert("Lista elementów do cięcia jest pusta. Dodaj elementy przed eksportem grafiki.");
        return;
    }

    const exportCanvas = document.createElement('canvas');
    const expCtx = exportCanvas.getContext('2d');
    const dpr = 2; // wysoka rozdzielczość

    const bannerHeight = 110;
    const padding = 20;
    const canvasCssW = canvas.width / (window.devicePixelRatio || 1);
    const canvasCssH = canvas.height / (window.devicePixelRatio || 1);
    const totalW = Math.max(canvasCssW + (padding * 2), 940);
    const totalH = canvasCssH + bannerHeight + (padding * 2);

    exportCanvas.width = totalW * dpr;
    exportCanvas.height = totalH * dpr;
    expCtx.scale(dpr, dpr);

    // Tło główne
    expCtx.fillStyle = '#0b0f19';
    expCtx.fillRect(0, 0, totalW, totalH);

    // Karta nagłówkowa
    expCtx.fillStyle = '#151d30';
    drawRoundRect(expCtx, padding, padding, totalW - (padding * 2), bannerHeight, 14);
    expCtx.fill();
    expCtx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    expCtx.lineWidth = 1;
    expCtx.stroke();

    // Tytuł
    expCtx.fillStyle = '#38bdf8';
    expCtx.font = 'bold 20px Outfit, sans-serif';
    expCtx.fillText('✂️ ScalTech CutList — Raport Rozkroju Materiału', padding + 18, padding + 34);

    // Metadane
    const now = new Date();
    const dateStr = now.toLocaleString('pl-PL');
    const ct = document.getElementById('cutThickness')?.value || 1.5;
    const et = document.getElementById('edgeTrim')?.value || 0;
    expCtx.fillStyle = '#94a3b8';
    expCtx.font = '500 12px Inter, sans-serif';
    expCtx.fillText(`Data: ${dateStr}   |   Rzaz piły: ${ct} mm   |   Margines brzegowy: ${et} mm`, padding + 18, padding + 56);

    // Statystyki
    const stockUsed = document.getElementById('totalLengthDisplay')?.textContent || '0';
    const eff = document.getElementById('efficiencyResult')?.textContent || '0%';
    const waste = document.getElementById('wasteResult')?.textContent || '0 mm';
    const blocks = document.getElementById('blocksUsedResult')?.textContent || '0 szt.';

    expCtx.fillStyle = '#f8fafc';
    expCtx.font = 'bold 13px Inter, sans-serif';
    expCtx.fillText(`Zużyty materiał: ${stockUsed} mm   •   Wydajność: ${eff}   •   Odpad: ${waste}   •   Użyte profile: ${blocks}`, padding + 18, padding + 84);

    // Narysuj schemat cięcia z canvasu
    expCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, padding, bannerHeight + padding + 10, totalW - (padding * 2), canvasCssH);

    // Konwertuj do PNG i dołącz metadane JSON projektu po znaczniku IEND
    exportCanvas.toBlob((blob) => {
        if (!blob) return;
        const projectJson = getProjectDataJSON();
        const metadataString = `\n/*SCALTECH_PROJECT:${projectJson}*/\n`;
        const metadataBlob = new Blob([metadataString], { type: 'text/plain' });
        const finalBlob = new Blob([blob, metadataBlob], { type: 'image/png' });

        const dateFormatted = now.toISOString().slice(0, 10);
        const timeFormatted = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        const filename = `Rozpiska_ScalTech_${dateFormatted}_${timeFormatted}.png`;
        downloadBlob(finalBlob, filename);
        showNotification(`🖼️ Zapisano obraz PNG: ${filename} (możesz otworzyć go jako grafikę lub załadować w programie).`);
    }, 'image/png');
}

// 3. Wczytywanie pliku przez maszynistę (Wybór pliku)
function triggerImportFile() {
    const input = document.getElementById('importFileInput');
    if (input) {
        input.value = '';
        input.click();
    }
}

function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (file) {
        processUploadedFile(file);
    }
}

// 4. Przetwarzanie wgrywanego pliku (.cutlist, .json, .png)
function processUploadedFile(file) {
    const reader = new FileReader();

    if (file.name.toLowerCase().endsWith('.png') || file.type === 'image/png') {
        reader.onload = (event) => {
            const content = event.target.result;
            const marker = '/*SCALTECH_PROJECT:';
            const startIdx = content.indexOf(marker);
            if (startIdx !== -1) {
                const endIdx = content.indexOf('*/', startIdx + marker.length);
                if (endIdx !== -1) {
                    const jsonStr = content.substring(startIdx + marker.length, endIdx);
                    loadProjectFromJSON(jsonStr, file.name);
                    return;
                }
            }
            alert("⚠️ Wskazany plik PNG nie zawiera zapisanych danych projektu ScalTech. Wczytaj plik .cutlist, .json lub PNG wyeksportowany przez aplikację ScalTech CutList.");
        };
        if (reader.readAsBinaryString) {
            reader.readAsBinaryString(file);
        } else {
            reader.readAsText(file);
        }
    } else {
        reader.onload = (event) => {
            const jsonStr = event.target.result;
            loadProjectFromJSON(jsonStr, file.name);
        };
        reader.readAsText(file);
    }
}

// 5. Odtworzenie stanu aplikacji z JSON
function loadProjectFromJSON(jsonStr, filename) {
    try {
        const data = JSON.parse(jsonStr);

        if (!data || (!data.itemsToCut && !data.availableSources)) {
            throw new Error("Plik nie zawiera poprawnych danych projektu ScalTech CutList.");
        }

        if (Array.isArray(data.availableSources) && data.availableSources.length > 0) {
            availableSources = data.availableSources;
            renderSourceProfilesDOM();
        }

        if (Array.isArray(data.itemsToCut)) {
            itemsToCut = data.itemsToCut;
            updateItemListDOM();
        }

        if (data.settings) {
            if (data.settings.cutThickness !== undefined) {
                const ct = document.getElementById('cutThickness');
                if (ct) ct.value = data.settings.cutThickness;
            }
            if (data.settings.edgeTrim !== undefined) {
                const et = document.getElementById('edgeTrim');
                if (et) et.value = data.settings.edgeTrim;
            }
            if (data.settings.algorithm) {
                const algo = document.getElementById('algoSelect');
                if (algo) algo.value = data.settings.algorithm;
            }
        }

        if (Array.isArray(data.completedCutIds)) {
            completedCutIds = new Set(data.completedCutIds);
        } else {
            completedCutIds.clear();
        }

        runOptimization();

        const totalItems = itemsToCut.reduce((sum, i) => sum + i.quantity, 0);
        showNotification(`✅ Załadowano rozpiskę z pliku "${filename}" (${totalItems} szt. elementów, ${availableSources.length} profili)`);
    } catch (err) {
        console.error("Błąd ładowania pliku:", err);
        alert(`❌ Błąd odczytu pliku: ${err.message || 'Nieprawidłowa struktura pliku'}`);
    }
}

// 6. Obsługa Drag & Drop na całym oknie dla wygody maszynisty
function initDragAndDrop() {
    const dropOverlay = document.getElementById('dragDropOverlay');
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter++;
        if (dropOverlay) dropOverlay.classList.remove('hidden');
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        if (dragCounter <= 0 && dropOverlay) {
            dragCounter = 0;
            dropOverlay.classList.add('hidden');
        }
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter = 0;
        if (dropOverlay) dropOverlay.classList.add('hidden');

        const file = e.dataTransfer?.files?.[0];
        if (file) {
            processUploadedFile(file);
        }
    });
}

// 7. Komunikaty Toast
function showNotification(msg) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 4500);
}


