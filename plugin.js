/**
 * CSV Importer Plugin for Thymer (Global)
 *
 * Features:
 * - Command palette: "Import CSV to Collection"
 * - Choose target collection
 * - Map CSV columns to: Title, Body, Properties, or Discard
 * - Deduplicate by unique field (default: title)
 * - Smart defaults for columns named title, body, or property_*
 */

export class Plugin extends AppPlugin {

    onLoad() {
        // Inject CSS for modal dialog
        this.ui.injectCSS(`
            /* Modal backdrop */
            .csv-import-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            /* Modal dialog */
            .csv-import-modal {
                background: var(--bg-default, #fff);
                border-radius: 12px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                width: 540px;
                max-width: 90vw;
                max-height: 85vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            .csv-import-header {
                padding: 16px 20px;
                border-bottom: 1px solid var(--border-default, #e5e5e5);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .csv-import-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-default, #111);
                margin: 0;
            }
            .csv-import-close {
                background: none;
                border: none;
                padding: 4px 8px;
                cursor: pointer;
                color: var(--text-muted, #666);
                font-size: 18px;
                line-height: 1;
                border-radius: 4px;
            }
            .csv-import-close:hover {
                background: var(--bg-hover, #f5f5f5);
            }
            .csv-import-body {
                padding: 20px;
                overflow-y: auto;
                flex: 1;
            }
            .csv-import-footer {
                padding: 16px 20px;
                border-top: 1px solid var(--border-default, #e5e5e5);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .csv-import-section {
                margin-bottom: 20px;
            }
            .csv-import-section:last-child {
                margin-bottom: 0;
            }
            .csv-import-label {
                font-weight: 500;
                margin-bottom: 6px;
                font-size: 13px;
                color: var(--text-default, #111);
            }
            .csv-import-hint {
                font-size: 12px;
                color: var(--text-muted, #666);
                margin-top: 4px;
            }
            .csv-import-select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border-default, #ddd);
                border-radius: 6px;
                background: var(--bg-default, #fff);
                color: var(--text-default, #111);
                cursor: pointer;
                font-size: 13px;
            }
            .csv-import-select:hover {
                border-color: var(--border-hover, #bbb);
            }
            .csv-import-select:focus {
                outline: none;
                border-color: var(--accent-default, #2563eb);
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }
            .csv-import-mappings {
                max-height: 220px;
                overflow-y: auto;
                border: 1px solid var(--border-default, #ddd);
                border-radius: 8px;
                background: var(--bg-subtle, #fafafa);
            }
            .csv-import-mapping-row {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                border-bottom: 1px solid var(--border-default, #eee);
            }
            .csv-import-mapping-row:last-child {
                border-bottom: none;
            }
            .csv-import-col-name {
                min-width: 120px;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 12px;
                color: var(--text-default, #111);
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .csv-import-arrow {
                color: var(--text-muted, #999);
                flex-shrink: 0;
            }
            .csv-import-mapping-select {
                flex: 1;
                min-width: 0;
            }
            .csv-import-btn {
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                font-size: 13px;
                transition: all 0.15s ease;
            }
            .csv-import-btn-primary {
                background: var(--accent-default, #2563eb);
                color: white;
                border: none;
            }
            .csv-import-btn-primary:hover {
                background: var(--accent-hover, #1d4ed8);
            }
            .csv-import-btn-primary:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .csv-import-btn-secondary {
                background: var(--bg-default, #fff);
                color: var(--text-default, #111);
                border: 1px solid var(--border-default, #ddd);
            }
            .csv-import-btn-secondary:hover {
                background: var(--bg-hover, #f5f5f5);
            }
            .csv-import-row-count {
                font-size: 13px;
                color: var(--text-muted, #666);
            }
            .csv-import-error {
                color: var(--text-danger, #dc2626);
                font-size: 13px;
                padding: 10px 12px;
                background: rgba(220, 38, 38, 0.1);
                border-radius: 6px;
                margin-top: 12px;
            }
            .csv-import-btn-group {
                display: flex;
                gap: 8px;
            }
        `);

        // Add command palette command
        this.command = this.ui.addCommandPaletteCommand({
            label: "Import CSV to Collection",
            icon: "download",
            onSelected: () => this.startImport()
        });
    }

    onUnload() {
        if (this.command) {
            this.command.remove();
        }
    }

    async startImport() {
        try {
            console.log('[CSV Import] Starting import...');

            // 1. Open file picker
            const file = await this.pickCSVFile();
            if (!file) {
                console.log('[CSV Import] No file selected');
                return;
            }
            console.log('[CSV Import] File selected:', file.name);

            // 2. Parse CSV
            const text = await file.text();
            console.log('[CSV Import] File text length:', text.length);
            const parsed = this.parseCSV(text);
            console.log('[CSV Import] Parsed headers:', parsed.headers);
            console.log('[CSV Import] Parsed rows:', parsed.rows.length);

            if (parsed.rows.length === 0) {
                this.ui.addToaster({
                    title: "Import Error",
                    message: "CSV file is empty or has no data rows",
                    dismissible: true,
                    autoDestroyTime: 3000
                });
                return;
            }

            // 3. Load collections
            console.log('[CSV Import] Loading collections...');
            const collections = await this.data.getAllCollections();
            console.log('[CSV Import] Collections found:', collections.length);

            if (collections.length === 0) {
                this.ui.addToaster({
                    title: "Import Error",
                    message: "No collections found in workspace",
                    dismissible: true,
                    autoDestroyTime: 3000
                });
                return;
            }

            // 4. Show configuration dialog
            console.log('[CSV Import] Showing dialog...');
            this.showImportDialog(parsed.headers, parsed.rows, collections);
        } catch (error) {
            console.error('[CSV Import] Error:', error);
            this.ui.addToaster({
                title: "Import Error",
                message: error.message || "Unknown error occurred",
                dismissible: true
            });
        }
    }

    pickCSVFile() {
        return new Promise((resolve) => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.csv,text/csv';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                document.body.removeChild(fileInput);
                resolve(file || null);
            });

            fileInput.addEventListener('cancel', () => {
                document.body.removeChild(fileInput);
                resolve(null);
            });

            fileInput.click();
        });
    }

    parseCSV(text) {
        const lines = [];
        let currentLine = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (inQuotes) {
                if (char === '"') {
                    if (nextChar === '"') {
                        currentField += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    currentField += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    currentLine.push(currentField);
                    currentField = '';
                } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                    currentLine.push(currentField);
                    if (currentLine.length > 0 && currentLine.some(f => f.trim() !== '')) {
                        lines.push(currentLine);
                    }
                    currentLine = [];
                    currentField = '';
                    if (char === '\r') i++;
                } else if (char !== '\r') {
                    currentField += char;
                }
            }
        }

        if (currentField || currentLine.length > 0) {
            currentLine.push(currentField);
            if (currentLine.some(f => f.trim() !== '')) {
                lines.push(currentLine);
            }
        }

        if (lines.length === 0) {
            return { headers: [], rows: [] };
        }

        const headers = lines[0].map(h => h.trim());
        const rows = lines.slice(1);

        return { headers, rows };
    }

    showImportDialog(headers, rows, collections) {
        // Try to default to the currently open collection
        const activePanel = this.ui.getActivePanel();
        const activeCollection = activePanel?.getActiveCollection?.();
        const activeCollectionGuid = activeCollection?.getGuid?.();

        let defaultCollection = collections[0];
        if (activeCollectionGuid) {
            const found = collections.find(c => c.getGuid() === activeCollectionGuid);
            if (found) defaultCollection = found;
        }

        // State
        this.dialogState = {
            selectedCollection: defaultCollection,
            uniqueField: '__title__',
            mappings: {}
        };

        // Initialize mappings with smart defaults
        const collectionConfig = this.dialogState.selectedCollection.getConfiguration();
        const collectionFields = (collectionConfig.fields || []).filter(f => f.active);
        const fieldsByName = new Map();
        collectionFields.forEach(f => {
            fieldsByName.set(f.label.toLowerCase(), f);
            fieldsByName.set(f.id.toLowerCase(), f);
        });

        headers.forEach((header, idx) => {
            const headerLower = header.toLowerCase();
            if (headerLower === 'title' || headerLower === 'name') {
                this.dialogState.mappings[idx] = { type: 'title' };
            } else if (headerLower === 'body' || headerLower === 'description' || headerLower === 'content') {
                this.dialogState.mappings[idx] = { type: 'body' };
            } else if (headerLower.startsWith('property_')) {
                // Check if property exists in collection
                const propName = headerLower.substring('property_'.length);
                const field = fieldsByName.get(propName);
                if (field) {
                    this.dialogState.mappings[idx] = { type: 'property', propertyId: field.id };
                } else {
                    this.dialogState.mappings[idx] = { type: 'discard' };
                }
            } else {
                // Check if header matches a property name directly
                const field = fieldsByName.get(headerLower);
                if (field) {
                    this.dialogState.mappings[idx] = { type: 'property', propertyId: field.id };
                } else {
                    this.dialogState.mappings[idx] = { type: 'discard' };
                }
            }
        });

        // Create modal backdrop
        this.modalBackdrop = document.createElement('div');
        this.modalBackdrop.className = 'csv-import-backdrop';
        this.modalBackdrop.innerHTML = this.buildDialogHTML(headers, rows, collections);
        document.body.appendChild(this.modalBackdrop);

        // Close on backdrop click
        this.modalBackdrop.addEventListener('click', (e) => {
            if (e.target === this.modalBackdrop) {
                this.closeDialog();
            }
        });

        // Attach handlers
        this.attachDialogHandlers(headers, rows, collections);
    }

    closeDialog() {
        if (this.modalBackdrop) {
            this.modalBackdrop.remove();
            this.modalBackdrop = null;
        }
    }

    buildDialogHTML(headers, rows, collections) {
        const selectedGuid = this.dialogState.selectedCollection.getGuid();
        const collectionOptions = collections.map(c => {
            const config = c.getConfiguration();
            const isSelected = c.getGuid() === selectedGuid;
            return `<option value="${c.getGuid()}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(config.name)}</option>`;
        }).join('');

        // Get collection fields for property options (exclude built-in title field)
        const collConfig = this.dialogState.selectedCollection.getConfiguration();
        const fields = (collConfig.fields || []).filter(f => f.active && f.id !== 'title');

        const mappingRows = headers.map((header, idx) => {
            const mapping = this.dialogState.mappings[idx];
            const propOptions = fields.map(f => {
                const isSelected = mapping.type === 'property' && mapping.propertyId === f.id;
                return `<option value="${f.id}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(f.label)}</option>`;
            }).join('');

            return `
                <div class="csv-import-mapping-row">
                    <span class="csv-import-col-name">${this.escapeHtml(header)}</span>
                    <span class="csv-import-arrow">→</span>
                    <select class="csv-import-select csv-import-mapping-select" data-idx="${idx}">
                        <option value="discard" ${mapping.type === 'discard' ? 'selected' : ''}>Discard</option>
                        <option value="title" ${mapping.type === 'title' ? 'selected' : ''}>Title</option>
                        <option value="body" ${mapping.type === 'body' ? 'selected' : ''}>Content</option>
                        ${propOptions ? `<optgroup label="Properties">${propOptions}</optgroup>` : ''}
                    </select>
                </div>
            `;
        }).join('');

        return `
            <div class="csv-import-modal">
                <div class="csv-import-header">
                    <h2 class="csv-import-title">Import CSV</h2>
                    <button class="csv-import-close" id="csv-import-close">✕</button>
                </div>
                <div class="csv-import-body">
                    <div class="csv-import-section">
                        <div class="csv-import-label">Target Collection</div>
                        <select class="csv-import-select" id="csv-import-collection">
                            ${collectionOptions}
                        </select>
                    </div>

                    <div class="csv-import-section">
                        <div class="csv-import-label">Deduplicate By</div>
                        <select class="csv-import-select" id="csv-import-unique">
                            <option value="__title__" selected>Title</option>
                            <option value="__none__">None (always create new)</option>
                        </select>
                        <div class="csv-import-hint">Records with matching value will be updated instead of created</div>
                    </div>

                    <div class="csv-import-section">
                        <div class="csv-import-label">Column Mappings</div>
                        <div class="csv-import-mappings">
                            ${mappingRows}
                        </div>
                    </div>

                    <div id="csv-import-error" class="csv-import-error" style="display: none;"></div>
                </div>
                <div class="csv-import-footer">
                    <span class="csv-import-row-count">${rows.length} row${rows.length !== 1 ? 's' : ''} to import</span>
                    <div class="csv-import-btn-group">
                        <button class="csv-import-btn csv-import-btn-secondary" id="csv-import-cancel">Cancel</button>
                        <button class="csv-import-btn csv-import-btn-primary" id="csv-import-submit">Import</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachDialogHandlers(headers, rows, collections) {
        const dialogEl = this.modalBackdrop;

        // Close button
        const closeBtn = dialogEl.querySelector('#csv-import-close');
        closeBtn.addEventListener('click', () => this.closeDialog());

        // Collection dropdown
        const collectionSelect = dialogEl.querySelector('#csv-import-collection');
        collectionSelect.addEventListener('change', () => {
            const guid = collectionSelect.value;
            this.dialogState.selectedCollection = collections.find(c => c.getGuid() === guid);
            this.updatePropertyOptions(dialogEl);
            this.updateUniqueFieldOptions(dialogEl);
        });

        // Initialize property options for first collection
        this.updatePropertyOptions(dialogEl);
        this.updateUniqueFieldOptions(dialogEl);

        // Mapping dropdowns
        const mappingSelects = dialogEl.querySelectorAll('.csv-import-mapping-select');
        mappingSelects.forEach(select => {
            select.addEventListener('change', () => {
                const idx = parseInt(select.dataset.idx);
                const value = select.value;

                // Update state
                if (value === 'title' || value === 'body' || value === 'discard') {
                    this.dialogState.mappings[idx] = { type: value };
                } else {
                    // Property mapping
                    this.dialogState.mappings[idx] = { type: 'property', propertyId: value };
                }

                this.validateMappings(dialogEl, headers);
            });
        });

        // Unique field dropdown
        const uniqueSelect = dialogEl.querySelector('#csv-import-unique');
        uniqueSelect.addEventListener('change', () => {
            this.dialogState.uniqueField = uniqueSelect.value;
        });

        // Cancel button
        const cancelBtn = dialogEl.querySelector('#csv-import-cancel');
        cancelBtn.addEventListener('click', () => this.closeDialog());

        // Import button
        const importBtn = dialogEl.querySelector('#csv-import-submit');
        importBtn.addEventListener('click', async () => {
            if (!this.validateMappings(dialogEl, headers)) return;

            importBtn.disabled = true;
            importBtn.textContent = 'Importing...';

            try {
                const result = await this.executeImport(headers, rows);
                this.closeDialog();

                this.ui.addToaster({
                    title: "Import Complete",
                    message: `Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
                    dismissible: true,
                    autoDestroyTime: 5000
                });
            } catch (error) {
                importBtn.disabled = false;
                importBtn.textContent = 'Import';

                const errorEl = dialogEl.querySelector('#csv-import-error');
                errorEl.textContent = error.message;
                errorEl.style.display = 'block';
            }
        });
    }

    updatePropertyOptions(dialogEl) {
        const collection = this.dialogState.selectedCollection;
        const config = collection.getConfiguration();
        // Exclude built-in title field since it's handled separately
        const fields = (config.fields || []).filter(f => f.active && f.id !== 'title');

        const mappingSelects = dialogEl.querySelectorAll('.csv-import-mapping-select');
        mappingSelects.forEach(select => {
            const propsGroup = select.querySelector('.csv-import-props-group');
            if (propsGroup) {
                propsGroup.innerHTML = fields.map(f =>
                    `<option value="${f.id}">${this.escapeHtml(f.label)}</option>`
                ).join('');
            }
        });
    }

    updateUniqueFieldOptions(dialogEl) {
        const collection = this.dialogState.selectedCollection;
        const config = collection.getConfiguration();
        // Exclude built-in title field since it's handled separately
        const fields = (config.fields || []).filter(f =>
            f.active && f.id !== 'title' && (f.type === 'text' || f.type === 'number')
        );

        const uniqueSelect = dialogEl.querySelector('#csv-import-unique');
        uniqueSelect.innerHTML = `
            <option value="__title__">Title</option>
            <option value="__none__">None (always create new)</option>
            ${fields.map(f => `<option value="${f.id}">${this.escapeHtml(f.label)}</option>`).join('')}
        `;
    }

    validateMappings(dialogEl, headers) {
        const errorEl = dialogEl.querySelector('#csv-import-error');
        const mappings = this.dialogState.mappings;

        // Check for exactly one title mapping
        const titleMappings = Object.values(mappings).filter(m => m.type === 'title');
        if (titleMappings.length === 0) {
            errorEl.textContent = 'At least one column must be mapped to Title';
            errorEl.style.display = 'block';
            return false;
        }
        if (titleMappings.length > 1) {
            errorEl.textContent = 'Only one column can be mapped to Title';
            errorEl.style.display = 'block';
            return false;
        }

        // Check for at most one body mapping
        const bodyMappings = Object.values(mappings).filter(m => m.type === 'body');
        if (bodyMappings.length > 1) {
            errorEl.textContent = 'Only one column can be mapped to Body';
            errorEl.style.display = 'block';
            return false;
        }

        errorEl.style.display = 'none';
        return true;
    }

    async executeImport(headers, rows) {
        const { selectedCollection, uniqueField, mappings } = this.dialogState;

        // Use the selected collection directly
        const collection = selectedCollection;

        // Build existing records map for deduplication
        let existingByKey = new Map();
        if (uniqueField !== '__none__') {
            const records = await collection.getAllRecords();
            console.log(`[CSV Import] Found ${records.length} records in collection`);

            for (const record of records) {
                let key;
                if (uniqueField === '__title__') {
                    key = record.getName()?.toLowerCase()?.trim();
                } else {
                    key = record.prop(uniqueField)?.text()?.toLowerCase()?.trim();
                }
                if (key) {
                    existingByKey.set(key, record);
                }
            }
            console.log(`[CSV Import] Found ${existingByKey.size} records for deduplication`);
        }

        // Find title column index and build property mappings with labels
        let titleIdx = null;
        let bodyIdx = null;
        const propertyMappings = [];

        // Get field info for property labels
        const collConfig = collection.getConfiguration();
        const fieldsById = new Map();
        for (const f of (collConfig.fields || [])) {
            fieldsById.set(f.id, f);
        }

        for (const [idx, mapping] of Object.entries(mappings)) {
            const i = parseInt(idx);
            if (mapping.type === 'title') {
                titleIdx = i;
            } else if (mapping.type === 'body') {
                bodyIdx = i;
            } else if (mapping.type === 'property') {
                const field = fieldsById.get(mapping.propertyId);
                propertyMappings.push({
                    idx: i,
                    propertyId: mapping.propertyId,
                    propertyLabel: field?.label || mapping.propertyId
                });
            }
        }

        let created = 0;
        let updated = 0;
        let skipped = 0;

        // Build a map of rows by unique key for "last wins" behavior
        const rowsByKey = new Map();
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const title = (row[titleIdx] || '').trim();
            if (!title) {
                skipped++;
                continue;
            }

            let key;
            if (uniqueField === '__none__') {
                key = `__row_${i}__`; // Unique key for each row
            } else if (uniqueField === '__title__') {
                key = title.toLowerCase();
            } else {
                // Find the column that maps to uniqueField
                const uniqueMapping = propertyMappings.find(m => m.propertyId === uniqueField);
                if (uniqueMapping) {
                    key = (row[uniqueMapping.idx] || '').toLowerCase().trim();
                } else {
                    key = title.toLowerCase();
                }
            }

            rowsByKey.set(key, { row, title, index: i });
        }

        // Process each unique row
        for (const [key, { row, title }] of rowsByKey) {
            let record;
            let isNew = false;

            // Check for existing record
            if (uniqueField !== '__none__' && existingByKey.has(key)) {
                record = existingByKey.get(key);
            } else {
                // Create new record
                const newGuid = collection.createRecord(title);
                if (!newGuid) {
                    skipped++;
                    continue;
                }
                record = this.data.getRecord(newGuid);
                if (!record) {
                    skipped++;
                    continue;
                }
                isNew = true;
                // Add to existing map in case there are more rows with same key
                existingByKey.set(key, record);
            }

            // Set properties
            for (const { idx, propertyId, propertyLabel } of propertyMappings) {
                const value = (row[idx] || '').trim();
                if (!value) continue;

                const prop = record.prop(propertyLabel) || record.prop(propertyId);
                if (prop) {
                    prop.set(value);
                }
            }

            // Set body/content
            if (bodyIdx !== null) {
                const body = (row[bodyIdx] || '').trim();
                if (body) {
                    const lineItems = await record.getLineItems();
                    if (lineItems.length > 0) {
                        lineItems[0].setSegments([
                            new PluginLineItemSegment('text', body)
                        ]);
                    }
                }
            }

            if (isNew) {
                created++;
            } else {
                updated++;
            }
        }

        return { created, updated, skipped };
    }

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
