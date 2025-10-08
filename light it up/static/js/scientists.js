class ScientistsPageManager {
    constructor() {
        this.scientists = [];
        this.elements = {
            list: document.getElementById('scientistsList'),
            details: document.getElementById('scientistDetails'),
        };
        this.init();
    }

    async init() {
        await this.fetchScientists();
        this.buildList();
    }

    async fetchScientists() {
        try {
            const response = await fetch('/get_scientists');
            const data = await response.json();
            this.scientists = data.scientists;
        } catch (error) {
            console.error("Failed to fetch scientists:", error);
            this.elements.details.innerHTML = `<p style="color:var(--danger);">Error loading scientists.</p>`;
        }
    }

    buildList() {
        this.elements.list.innerHTML = '';
        this.scientists.forEach((scientist, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'scientist-item';
            listItem.textContent = scientist.name;
            listItem.addEventListener('click', () => {
                this.displayScientist(scientist);
                this.updateActiveListItem(listItem);
            });
            this.elements.list.appendChild(listItem);
        });
    }

    displayScientist(scientist) {
        this.elements.details.innerHTML = `
            <div class="scientist-card">
                <h3>${scientist.name}</h3>
                <h4>Key Discoveries</h4>
                <p>${scientist.discoveries}</p>
                <h4>Biography</h4>
                <p>${scientist.bio}</p>
            </div>
        `;
    }

    updateActiveListItem(activeItem) {
        this.elements.list.querySelectorAll('.scientist-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ScientistsPageManager();
});