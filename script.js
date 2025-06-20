document.addEventListener('DOMContentLoaded', () => {
    const json1Textarea = document.getElementById('json1');
    const json2Textarea = document.getElementById('json2');
    const keySelect = document.getElementById('key-select');
    const compareBtn = document.getElementById('compare-btn');
    const resultsContainer = document.getElementById('results-container');
    const prettifyBtns = document.querySelectorAll('.prettify-btn');
    const multiKeyToggle = document.getElementById('multi-key-toggle');
    const singleKeyWrapper = document.getElementById('single-key-wrapper');
    const multiKeyWrapper = document.getElementById('multi-key-wrapper');
    const multiKeyDropdown = document.getElementById('multi-key-dropdown');
    const multiKeyDropdownBtn = document.getElementById('multi-key-dropdown-btn');

    let json1, json2;
    let availableKeys = [];
    let selectedMultiKeys = [];

    const setInitialState = () => {
        keySelect.innerHTML = '<option value="">Enter JSON to see keys</option>';
        keySelect.disabled = true;
        resultsContainer.innerHTML = '<p class="results-placeholder">Comparison results will appear here.</p>';
    };

    const findComparableArray = (data) => {
        if (Array.isArray(data)) {
            return data;
        }
        if (typeof data === 'object' && data !== null) {
            // Find the first key that has an array of objects as its value
            const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]) && data[key].length > 0 && typeof data[key][0] === 'object');
            if (arrayKey) {
                return data[arrayKey];
            }
        }
        return null;
    };

    const populateKeySelect = () => {
        try {
            const val1 = json1Textarea.value.trim();
            const val2 = json2Textarea.value.trim();

            if (!val1 || !val2) {
                keySelect.innerHTML = '<option value="">Enter JSON to see keys</option>';
                keySelect.disabled = true;
                return;
            }

            const parsedJson1 = JSON.parse(val1);
            const parsedJson2 = JSON.parse(val2);

            json1 = findComparableArray(parsedJson1);
            json2 = findComparableArray(parsedJson2);

            if (json1 && json1.length > 0 && json2 && json2.length > 0) {
                const keys1 = Object.keys(json1[0]);
                const keys2 = Object.keys(json2[0]);
                const commonKeys = keys1.filter(key => keys2.includes(key));

                keySelect.innerHTML = ''; // Clear options
                if (commonKeys.length > 0) {
                    const placeholder = document.createElement('option');
                    placeholder.textContent = "Select a comparison key";
                    placeholder.value = "";
                    placeholder.disabled = true;
                    placeholder.selected = true;
                    keySelect.appendChild(placeholder);

                    commonKeys.forEach(key => {
                        const option = document.createElement('option');
                        option.value = key;
                        option.textContent = key;
                        keySelect.appendChild(option);
                    });
                    keySelect.disabled = false;
                } else {
                    keySelect.innerHTML = '<option value="">No common keys found</option>';
                    keySelect.disabled = true;
                }
            } else {
                keySelect.innerHTML = '<option value="">Comparable array not found</option>';
                keySelect.disabled = true;
            }
        } catch (error) {
            keySelect.innerHTML = '<option value="">Invalid JSON detected</option>';
            keySelect.disabled = true;
            console.error("Error parsing JSON:", error);
        }
    };

    json1Textarea.addEventListener('input', populateKeySelect);
    json2Textarea.addEventListener('input', populateKeySelect);

    compareBtn.addEventListener('click', () => {
        const selectedKey = keySelect.value;
        if (!selectedKey) {
            resultsContainer.innerHTML = '<p class="results-placeholder error">Please select a key to compare.</p>';
            return;
        }

        if (!json1 || !json2) {
            resultsContainer.innerHTML = '<p class="results-placeholder error">Please provide valid JSON and ensure a comparable array is found.</p>';
            return;
        }
        
        const uniqueInJson1 = findUnique(json1, json2, selectedKey);
        const uniqueInJson2 = findUnique(json2, json1, selectedKey);

        const combinedUnique = [...uniqueInJson1, ...uniqueInJson2];

        displayResults(uniqueInJson1, uniqueInJson2, combinedUnique);

    });

    const findUnique = (arr1, arr2, key) => {
        const valuesInArr2 = new Set(arr2.map(item => item[key]));
        return arr1.filter(item => !valuesInArr2.has(item[key]));
    };

    const displayResults = (unique1, unique2, combined) => {
        const title1 = document.getElementById('json1-title').textContent || 'JSON 1';
        const title2 = document.getElementById('json2-title').textContent || 'JSON 2';

        const formatWithLineNumbers = (data) => {
            const jsonString = JSON.stringify(data, null, 2) || '';
            if (jsonString === '[]') return '<span class="line-number">1</span><span>[]</span>';
            if (!jsonString || jsonString === 'null') return '<span class="line-number">1</span><span>No unique items.</span>';
            return jsonString.split('\n').map((line, idx) => `<span class="line-number">${idx + 1}</span><span>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`).join('\n');
        };

        // Helper to create a collapsible section
        const createSection = (title, content, sectionId, count) => {
            return `
                <div class="result-section" id="${sectionId}">
                    <div class="result-header">
                        <button class="collapse-btn" aria-expanded="true" aria-controls="${sectionId}-pre" title="Collapse/Expand">
                            <span class="chevron">
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 8L10 12L14 8" stroke="#3498db" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                        </button>
                        <h3>${title} (${count})</h3>
                    </div>
                    <pre class="line-numbers-pre" id="${sectionId}-pre"><code>${content}</code></pre>
                </div>
            `;
        };

        resultsContainer.innerHTML =
            createSection(`Unique in ${title1}`, formatWithLineNumbers(unique1), 'unique1', unique1.length) +
            createSection(`Unique in ${title2}`, formatWithLineNumbers(unique2), 'unique2', unique2.length) +
            createSection('Combined Unique Data', formatWithLineNumbers(combined), 'combined', combined.length);

        // Add collapse/expand logic
        document.querySelectorAll('.collapse-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const section = btn.closest('.result-section');
                const pre = section.querySelector('pre');
                const chevron = btn.querySelector('.chevron');
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                if (expanded) {
                    pre.style.display = 'none';
                    btn.setAttribute('aria-expanded', 'false');
                    btn.classList.add('collapsed');
                } else {
                    pre.style.display = '';
                    btn.setAttribute('aria-expanded', 'true');
                    btn.classList.remove('collapsed');
                }
            });
        });
    };

    prettifyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const textarea = document.getElementById(targetId);
            try {
                const ugly = textarea.value;
                if (ugly.trim() === '') return;
                const obj = JSON.parse(ugly);
                const pretty = JSON.stringify(obj, undefined, 2);
                textarea.value = pretty;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (e) {
                alert('Invalid JSON! Cannot prettify.');
                console.error('Prettify Error:', e);
            }
        });
    });

    // Toggle between single and multi-key UI
    multiKeyToggle.addEventListener('change', () => {
        if (multiKeyToggle.checked) {
            singleKeyWrapper.style.display = 'none';
            multiKeyWrapper.style.display = '';
            updateMultiKeyDropdown();
        } else {
            singleKeyWrapper.style.display = '';
            multiKeyWrapper.style.display = 'none';
        }
    });

    // Show/hide the custom dropdown
    multiKeyDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (multiKeyDropdown.style.display === 'block') {
            multiKeyDropdown.style.display = 'none';
        } else {
            updateMultiKeyDropdown();
            multiKeyDropdown.style.display = 'block';
        }
    });
    document.addEventListener('click', (e) => {
        if (multiKeyDropdown.style.display === 'block') {
            multiKeyDropdown.style.display = 'none';
        }
    });
    multiKeyDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    function updateMultiKeyDropdown() {
        multiKeyDropdown.innerHTML = '';
        availableKeys.forEach(key => {
            const id = `multi-key-checkbox-${key}`;
            const label = document.createElement('label');
            label.setAttribute('for', id);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = id;
            checkbox.value = key;
            checkbox.checked = selectedMultiKeys.includes(key);
            if (checkbox.checked) label.classList.add('selected');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    selectedMultiKeys.push(key);
                    label.classList.add('selected');
                } else {
                    selectedMultiKeys = selectedMultiKeys.filter(k => k !== key);
                    label.classList.remove('selected');
                }
                updateMultiKeyDropdownBtnText();
            });
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(key));
            // Add checkmark span
            const checkmark = document.createElement('span');
            checkmark.className = 'checkmark';
            checkmark.innerHTML = '&#10003;';
            label.appendChild(checkmark);
            multiKeyDropdown.appendChild(label);
        });
        updateMultiKeyDropdownBtnText();
    }
    function updateMultiKeyDropdownBtnText() {
        if (selectedMultiKeys.length === 0) {
            multiKeyDropdownBtn.textContent = 'Select comparison key(s)';
        } else {
            multiKeyDropdownBtn.textContent = selectedMultiKeys.join(', ');
        }
    }

    // Update populateKeySelect to also update availableKeys and reset selectedMultiKeys
    const originalPopulateKeySelect = populateKeySelect;
    const newPopulateKeySelect = () => {
        try {
            const val1 = json1Textarea.value.trim();
            const val2 = json2Textarea.value.trim();
            if (!val1 || !val2) {
                keySelect.innerHTML = '<option value="">Enter JSON to see keys</option>';
                keySelect.disabled = true;
                availableKeys = [];
                selectedMultiKeys = [];
                updateMultiKeyDropdown();
                return;
            }
            const parsedJson1 = JSON.parse(val1);
            const parsedJson2 = JSON.parse(val2);
            json1 = findComparableArray(parsedJson1);
            json2 = findComparableArray(parsedJson2);
            if (json1 && json1.length > 0 && json2 && json2.length > 0) {
                const keys1 = Object.keys(json1[0]);
                const keys2 = Object.keys(json2[0]);
                const commonKeys = keys1.filter(key => keys2.includes(key));
                availableKeys = commonKeys;
                selectedMultiKeys = [];
                keySelect.innerHTML = '';
                if (commonKeys.length > 0) {
                    const placeholder = document.createElement('option');
                    placeholder.textContent = "Select a comparison key";
                    placeholder.value = "";
                    placeholder.disabled = true;
                    placeholder.selected = true;
                    keySelect.appendChild(placeholder);
                    commonKeys.forEach(key => {
                        const option = document.createElement('option');
                        option.value = key;
                        option.textContent = key;
                        keySelect.appendChild(option);
                    });
                    keySelect.disabled = false;
                } else {
                    keySelect.innerHTML = '<option value="">No common keys found</option>';
                    keySelect.disabled = true;
                }
                updateMultiKeyDropdown();
            } else {
                keySelect.innerHTML = '<option value="">Comparable array not found</option>';
                keySelect.disabled = true;
                availableKeys = [];
                selectedMultiKeys = [];
                updateMultiKeyDropdown();
            }
        } catch (error) {
            keySelect.innerHTML = '<option value="">Invalid JSON detected</option>';
            keySelect.disabled = true;
            availableKeys = [];
            selectedMultiKeys = [];
            updateMultiKeyDropdown();
            console.error("Error parsing JSON:", error);
        }
    };
    json1Textarea.removeEventListener('input', populateKeySelect);
    json2Textarea.removeEventListener('input', populateKeySelect);
    json1Textarea.addEventListener('input', newPopulateKeySelect);
    json2Textarea.addEventListener('input', newPopulateKeySelect);
    // Call once to initialize
    newPopulateKeySelect();

    // Update compareBtn logic
    compareBtn.addEventListener('click', () => {
        if (multiKeyToggle.checked) {
            if (!selectedMultiKeys.length) {
                resultsContainer.innerHTML = '<p class="results-placeholder error">Please select at least one key to compare.</p>';
                return;
            }
            if (!json1 || !json2) {
                resultsContainer.innerHTML = '<p class="results-placeholder error">Please provide valid JSON and ensure a comparable array is found.</p>';
                return;
            }
            const uniqueInJson1 = findUniqueMulti(json1, json2, selectedMultiKeys);
            const uniqueInJson2 = findUniqueMulti(json2, json1, selectedMultiKeys);
            const combinedUnique = [...uniqueInJson1, ...uniqueInJson2];
            displayResults(uniqueInJson1, uniqueInJson2, combinedUnique);
        } else {
            const selectedKey = keySelect.value;
            if (!selectedKey) {
                resultsContainer.innerHTML = '<p class="results-placeholder error">Please select a key to compare.</p>';
                return;
            }
            if (!json1 || !json2) {
                resultsContainer.innerHTML = '<p class="results-placeholder error">Please provide valid JSON and ensure a comparable array is found.</p>';
                return;
            }
            const uniqueInJson1 = findUnique(json1, json2, selectedKey);
            const uniqueInJson2 = findUnique(json2, json1, selectedKey);
            const combinedUnique = [...uniqueInJson1, ...uniqueInJson2];
            displayResults(uniqueInJson1, uniqueInJson2, combinedUnique);
        }
    });

    // Helper for multi-key composite
    const getCompositeKey = (obj, keys) => keys.map(k => String(obj[k])).join('||');
    const findUniqueMulti = (arr1, arr2, keys) => {
        const valuesInArr2 = new Set(arr2.map(item => getCompositeKey(item, keys)));
        return arr1.filter(item => !valuesInArr2.has(getCompositeKey(item, keys)));
    };

    setInitialState();
}); 