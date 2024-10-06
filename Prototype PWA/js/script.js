// For Itinerary Page
function addDestination() {
    const input = document.getElementById('destinationInput');
    const destinationList = document.getElementById('destinationList');
    
    if (input.value) {
        const listItem = document.createElement('li');
        listItem.textContent = input.value;
        destinationList.appendChild(listItem);
        input.value = ''; // Clear input
    }
}

// For Packing List Page
function addPackingItem() {
    const input = document.getElementById('itemInput');
    const packingList = document.getElementById('packingList');
    
    if (input.value) {
        const listItem = document.createElement('li');
        listItem.textContent = input.value;
        packingList.appendChild(listItem);
        input.value = ''; // Clear input
    }
}
