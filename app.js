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
        itemListDiv.innerHTML = '<p style="color: #94a3b8; grid-column: 1/-1; text-align: center;">Dodaj elementy, aby zobaczyć je na liście.</p>';
        return;
    }
    
    itemsToCut.forEach((group, index) => {
        const div = document.createElement('div');
        div.className = 'item-badge';
        div.innerHTML = `
            <span><strong>${group.length} mm</strong> (x${group.quantity})</span>
            <button class="danger" onclick="removeItemFromItems(${index})">Usuń</button>
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
        alert("Podaj poprawną długość.");
        return;
    }
    if (isNaN(quantity) || quantity < 1) {
        alert("Ilość musi być większa od 0.");
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
    const cutThickness = parseFloat(document.getElementById('cutThickness').value) || 0; // Now all in mm

    if (totalStockLength <= 0) {
        updateStats(0, 0, 0, 0);
        return;
    }

    // Flatten items for optimization
    let flatItems = [];
    itemsToCut.forEach(group => {
        for (let i = 0; i < group.quantity; i++) {
            flatItems.push(group.length);
        }
    });

    // Sort descending
    flatItems.sort((a, b) => b - a);

    // Validate: no single item can be longer than stock
    const tooLong = flatItems.find(len => len > totalStockLength);
    if (tooLong) {
        showErrorOnCanvas(`Błąd: Element ${tooLong} mm jest dłuższy niż stock (${totalStockLength} mm)`);
        updateStats(totalStockLength, 0, 0, 0);
        return;
    }

    // Bin Packing (First Fit)
    let bins = []; // Each bin is { remaining: number, items: number[] }

    flatItems.forEach(itemLen => {
        let placed = false;
        for (let bin of bins) {
            const needed = bin.items.length === 0 ? itemLen : itemLen + cutThickness;
            if (bin.remaining >= needed) {
                bin.items.push(itemLen);
                bin.remaining -= needed;
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
    const totalCuts = bins.reduce((sum, bin) => sum + Math.max(0, bin.items.length), 0);

    updateStats(totalStockLength, totalWaste, totalCuts, bins.length);
    drawVisualization(totalStockLength, bins, cutThickness);
}

function updateStats(stock, waste, cuts, blocks) {
    const stockEl = document.getElementById('totalLengthDisplay');
    const wasteEl = document.getElementById('wasteResult');
    const cutsEl = document.getElementById('cutCountResult');
    const blocksEl = document.getElementById('blocksUsedResult');
    
    if (stockEl) stockEl.textContent = stock.toFixed(0);
    if (wasteEl) wasteEl.textContent = `${waste.toFixed(0)} mm`;
    if (cutsEl) cutsEl.textContent = cuts;
    if (blocksEl) blocksEl.textContent = blocks;
}

function showErrorOnCanvas(msg) {
    const canvas = document.getElementById('visualizationCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(msg, canvas.width / 2, 100);
}

/**
 * Draws the bins and items on the canvas.
 */
function drawVisualization(totalStockLength, bins, cutThickness) {
    const canvas = document.getElementById('visualizationCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const padding = 40;
    const binHeight = 60;
    const binGap = 20;
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = Math.max(200, (bins.length * (binHeight + binGap)) + (padding * 2));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const drawWidth = canvas.width - (padding * 2);
    const scale = drawWidth / totalStockLength;

    bins.forEach((bin, bIdx) => {
        const y = padding + (bIdx * (binHeight + binGap));
        
        // Draw Bin (Stock Material)
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(padding, y, drawWidth, binHeight, 8);
        ctx.fill();
        
        // Label for Stock
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(`Profil #${bIdx + 1}`, padding, y - 5);

        let currentX = padding;
        bin.items.forEach((itemLen, iIdx) => {
            const itemWidth = itemLen * scale;
            
            // Draw Item
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.roundRect(currentX, y + 5, itemWidth, binHeight - 10, 4);
            ctx.fill();
            
            // Item Label
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'center';
            if (itemWidth > 30) {
                ctx.fillText(`${itemLen}`, currentX + (itemWidth / 2), y + (binHeight / 2) + 4);
            }

            currentX += itemWidth;

            // Draw Cut (Kerf)
            if (iIdx < bin.items.length - 1) {
                const kerfWidth = Math.max(1, cutThickness * scale);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(currentX, y + 5, kerfWidth, binHeight - 10);
                currentX += kerfWidth;
            }
        });

        // Remaining text
        if (bin.remaining > 0.1) {
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'right';
            ctx.fillText(`Odpady: ${bin.remaining.toFixed(0)} mm`, padding + drawWidth, y + binHeight + 15);
        }
    });
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    updateItemListDOM();
    runOptimization();
});

// Handle window resize for canvas
window.addEventListener('resize', runOptimization);