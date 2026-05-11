// --- Global state ---
let itemsToCut = []; 

/**
 * Updates the item list in the DOM.
 */
function updateItemListDOM() {
    const itemListDiv = document.getElementById('itemList');
    if (!itemListDiv) return; 

    itemListDiv.innerHTML = '';

    if (itemsToCut.length === 0) {
        itemListDiv.innerHTML = '<p class="empty-msg" style="color: #94a3b8; grid-column: 1/-1; text-align: center; padding: 20px; font-style: italic;">Brak elementów na liście. Dodaj coś powyżej.</p>';
        return;
    }
    
    itemsToCut.forEach((group, index) => {
        const div = document.createElement('div');
        div.className = 'item-badge';
        div.innerHTML = `
            <span><strong>${group.length} mm</strong> <small>(x${group.quantity})</small></span>
            <button class="btn-danger-sm" onclick="removeItemFromItems(${index})">Usuń</button>
        `;
        itemListDiv.appendChild(div);
    });
}

/**
 * Adds a group of items to the list.
 */
function addItemToItems() {
    const lengthInput = document.getElementById('newItemLength');
    const quantityInput = document.getElementById('newItemQuantity');

    const length = parseFloat(lengthInput.value);
    const quantity = parseInt(quantityInput.value);

    if (isNaN(length) || length <= 0) {
        alert("Podaj poprawną długość elementu.");
        lengthInput.focus();
        return;
    }
    if (isNaN(quantity) || quantity < 1) {
        alert("Ilość musi być liczbą dodatnią.");
        quantityInput.focus();
        return;
    }
    
    // Check if group with same length exists
    const existing = itemsToCut.find(i => i.length === length);
    if (existing) {
        existing.quantity += quantity;
    } else {
        itemsToCut.push({ length, quantity });
    }

    updateItemListDOM();
    lengthInput.value = ''; 
    quantityInput.value = '1';
    lengthInput.focus();
    
    runOptimization();
}

/**
 * Removes a group of items.
 */
function removeItemFromItems(index) {
    itemsToCut.splice(index, 1);
    updateItemListDOM();
    runOptimization();
}

/**
 * Main optimization logic (First Fit Decreasing).
 */
function runOptimization() {
    const totalStockLength = parseFloat(document.getElementById('totalLength').value) || 0;
    const cutThickness = parseFloat(document.getElementById('cutThickness').value) || 0;

    if (totalStockLength <= 0) {
        updateStats(0, 0, 0, 0);
        clearCanvas();
        return;
    }

    // Flatten items for optimization
    let flatItems = [];
    itemsToCut.forEach(group => {
        for (let i = 0; i < group.quantity; i++) {
            flatItems.push(group.length);
        }
    });

    // Sort descending for FFD
    flatItems.sort((a, b) => b - a);

    // Validate: no single item can be longer than stock
    const tooLong = flatItems.find(len => len > totalStockLength);
    if (tooLong) {
        showErrorOnCanvas(`Błąd: Element ${tooLong}mm przekracza długość materiału (${totalStockLength}mm)`);
        updateStats(totalStockLength, 0, 0, 0);
        return;
    }

    if (flatItems.length === 0) {
        updateStats(totalStockLength, 0, 0, 0);
        clearCanvas();
        return;
    }

    // Bin Packing (First Fit)
    let bins = []; 

    flatItems.forEach(itemLen => {
        let placed = false;
        for (let bin of bins) {
            // Check if item fits including kerf (if not first item in bin)
            const kerf = bin.items.length > 0 ? cutThickness : 0;
            if (bin.remaining >= (itemLen + kerf)) {
                bin.items.push(itemLen);
                bin.remaining -= (itemLen + kerf);
                placed = true;
                break;
            }
        }
        if (!placed) {
            bins.push({
                remaining: totalStockLength - itemLen,
                items: [itemLen]
            });
        }
    });

    const totalWaste = bins.reduce((sum, bin) => sum + bin.remaining, 0);
    const actualCutCount = flatItems.length;

    updateStats(totalStockLength, totalWaste, actualCutCount, bins.length);
    drawVisualization(totalStockLength, bins, cutThickness);
}

function updateStats(stock, waste, cuts, blocks) {
    const stockEl = document.getElementById('totalLengthDisplay');
    const wasteEl = document.getElementById('wasteResult');
    const cutsEl = document.getElementById('cutCountResult');
    const blocksEl = document.getElementById('blocksUsedResult');
    
    if (stockEl) stockEl.textContent = stock.toLocaleString('pl-PL');
    if (wasteEl) wasteEl.textContent = `${waste.toLocaleString('pl-PL', {maximumFractionDigits: 1})} mm`;
    if (cutsEl) cutsEl.textContent = cuts;
    if (blocksEl) blocksEl.textContent = blocks;
}

function clearCanvas() {
    const canvas = document.getElementById('visualizationCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function showErrorOnCanvas(msg) {
    const canvas = document.getElementById('visualizationCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale for high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr; // Fixed height for error
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, 200);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg, rect.width / 2, 100);
}

/**
 * Draws the bins and items on the canvas with proper scaling.
 */
function drawVisualization(totalStockLength, bins, cutThickness) {
    const canvas = document.getElementById('visualizationCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // DPI Scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const padding = 20;
    const binHeight = 50;
    const binGap = 40;
    const headerHeight = 30;
    
    const totalHeightNeeded = padding * 2 + bins.length * (binHeight + binGap);
    
    canvas.width = rect.width * dpr;
    canvas.height = totalHeightNeeded * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, rect.width, totalHeightNeeded);

    const drawableWidth = rect.width - (padding * 2);
    const scale = drawableWidth / totalStockLength;

    bins.forEach((bin, bIdx) => {
        const y = padding + (bIdx * (binHeight + binGap)) + headerHeight;
        
        // Draw Bin Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`PROFIL #${bIdx + 1}`, padding, y - 10);
        
        // Draw Waste Info
        ctx.textAlign = 'right';
        ctx.fillStyle = bin.remaining > 50 ? '#94a3b8' : '#ef4444';
        ctx.fillText(`Odpad: ${bin.remaining.toFixed(1)} mm`, padding + drawableWidth, y - 10);

        // Draw Stock Material Background
        ctx.fillStyle = '#334155';
        drawRoundRect(ctx, padding, y, drawableWidth, binHeight, 8);
        ctx.fill();
        
        let currentX = padding;
        bin.items.forEach((itemLen, iIdx) => {
            const itemWidth = itemLen * scale;
            
            // Draw Item
            const gradient = ctx.createLinearGradient(currentX, y, currentX, y + binHeight);
            gradient.addColorStop(0, '#38bdf8');
            gradient.addColorStop(1, '#818cf8');
            
            ctx.fillStyle = gradient;
            drawRoundRect(ctx, currentX, y + 4, itemWidth, binHeight - 8, 4);
            ctx.fill();
            
            // Item Text
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            if (itemWidth > 30) {
                ctx.fillText(`${itemLen}`, currentX + (itemWidth / 2), y + (binHeight / 2) + 4);
            }

            currentX += itemWidth;

            // Draw Cut (Kerf)
            if (iIdx < bin.items.length - 1) {
                const kerfWidth = Math.max(1, cutThickness * scale);
                ctx.fillStyle = '#f472b6'; // Accent color for cut
                ctx.fillRect(currentX, y + 4, kerfWidth, binHeight - 8);
                currentX += (cutThickness * scale);
            }
        });
    });
}

/**
 * Utility to draw rounded rectangles.
 */
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

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for Enter key on inputs
    document.getElementById('newItemLength').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItemToItems();
    });
    document.getElementById('newItemQuantity').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItemToItems();
    });

    updateItemListDOM();
    runOptimization();
});

// Handle window resize for canvas
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(runOptimization, 100);
});

// Global accessibility
window.addItemToItems = addItemToItems;
window.removeItemFromItems = removeItemFromItems;
window.runOptimization = runOptimization;
