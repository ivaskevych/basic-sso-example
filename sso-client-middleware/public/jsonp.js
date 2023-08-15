const resultsContainer = document.getElementById('results');

function myJsonpFunction(data) {
    try {
        resultsContainer.innerHTML = JSON.stringify(data, null, 2);
    } catch (e) {
        resultsContainer.innerHTML = "Failed to load";
    }
}