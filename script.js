document.addEventListener('DOMContentLoaded', () => {
    const json1Textarea = document.getElementById('json1');
    const json2Textarea = document.getElementById('json2');
    const keySelect = document.getElementById('key-select');
    const compareBtn = document.getElementById('compare-btn');
    const resultsContainer = document.getElementById('results-container');
    const prettifyBtns = document.querySelectorAll('.prettify-btn');

    let json1, json2;

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
        
        resultsContainer.innerHTML = `
            <div class="result-section">
                <h3>Unique in ${title1} (${unique1.length})</h3>
                <pre class="line-numbers-pre"><code>${formatWithLineNumbers(unique1)}</code></pre>
            </div>
            <div class="result-section">
                <h3>Unique in ${title2} (${unique2.length})</h3>
                <pre class="line-numbers-pre"><code>${formatWithLineNumbers(unique2)}</code></pre>
            </div>
            <div class="result-section">
                <h3>Combined Unique Data (${combined.length})</h3>
                <pre class="line-numbers-pre"><code>${formatWithLineNumbers(combined)}</code></pre>
            </div>
        `;
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

    setInitialState();
}); 