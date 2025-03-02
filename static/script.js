let allTeachers = [];
const filters = {
    fach: [],
    klassenstufe: '',
    preis: 50,
    bewertung: '',
    kapazitaet: '',
    wochentage: ''
};

// Funktion zur Darstellung der Lehrerliste basierend auf Filtern und Suche
function renderTeacherList(teachers, searchTerm = '') {
    const teacherList = document.getElementById('teacher-list');
    if (!teacherList) { // Überprüfen, ob das Lehrerlisten-Element existiert
        console.error('Lehrerliste-Element nicht gefunden');
        return;
    }
    teacherList.innerHTML = '';

    if (!Array.isArray(teachers)) { // Überprüfen, ob die Lehrerdaten ein Array sind
        console.error('Lehrerdaten sind kein Array:', teachers);
        teacherList.innerHTML = '<p class="text-dark-gray text-center p-4">Ungültiges Lehrer-Datenformat</p>';
        return;
    }

    const filteredTeachers = teachers.filter(teacher => {
        if (!teacher || typeof teacher !== 'object') { // Überprüfen, ob das Lehrerobjekt gültig ist
            console.warn('Ungültiges Lehrerobjekt:', teacher);
            return false;
        }

        const matchesFilters = (
            (filters.fach.length === 0 || filters.fach.some(f => teacher.fach && teacher.fach.toLowerCase() === f.toLowerCase())) && // Überprüfen, ob der Lehrer dem Fachfilter entspricht
            (!filters.klassenstufe || (teacher.klassenstufe && String(teacher.klassenstufe) === filters.klassenstufe)) && // Überprüfen, ob der Lehrer dem Klassenstufenfilter entspricht
            (teacher.preis !== undefined && teacher.preis <= filters.preis) && // Überprüfen, ob der Lehrer dem Preisfilter entspricht
            (!filters.bewertung || (teacher.bewertung && teacher.bewertung >= parseInt(filters.bewertung))) && // Überprüfen, ob der Lehrer dem Bewertungsfilter entspricht
            (!filters.kapazitaet || (filters.kapazitaet === 'frei' ? teacher.kapazitaet > 0 : teacher.kapazitaet === 0)) && // Überprüfen, ob der Lehrer dem Kapazitätsfilter entspricht
            (filters.wochentage.length === 0 || filters.wochentage.some(day => teacher.wochentage && teacher.wochentage.includes(day))) // Überprüfen, ob der Lehrer dem Wochentagefilter entspricht
        );

        const matchesSearch = searchTerm === '' || 
            (teacher.name_schueler && teacher.name_schueler.toLowerCase().includes(searchTerm.toLowerCase())) || 
            (teacher.fach && teacher.fach.toLowerCase().includes(searchTerm.toLowerCase())); // Überprüfen, ob der Lehrer der Suchanfrage entspricht

        return matchesFilters && matchesSearch;
    });

    if (filteredTeachers.length === 0) {
        teacherList.innerHTML = '<p class="text-dark-gray text-center p-4">Keine Lehreranzeigen entsprechen den Filtern oder der Suche.</p>';
        return;
    }

    filteredTeachers.forEach(teacher => {
        const teacherEntry = document.createElement('div');
        teacherEntry.className = 'teacher-entry flex items-center p-4 border-b border-custom-gray hover:bg-hover-gray cursor-pointer';
        teacherEntry.innerHTML = `
            <img src="https://imgs.search.brave.com/J5-KJNoclGIgO9mgbMuULm8xw_ri-hvqZYOyhc50Q64/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAyLzE3LzM0LzY3/LzM2MF9GXzIxNzM0/Njc4Ml83WHBDVHQ4/YkxOSnF2VkFhRFpK/d3Zaam0wZXBRbWo2/ai5qcGc" alt="Profilbild" class="w-12 h-12 rounded-full mr-4">
            <div>
                <strong class="text-dark-text">${teacher.name_schueler || 'Unbekannt'}</strong><br>
                <span class="text-dark-gray">Fach: ${teacher.fach || 'N/A'}</span><br>
                <span class="text-dark-gray">Klassenstufe: ${teacher.klassenstufe || 'N/A'}</span>
            </div>
        `;

        teacherEntry.addEventListener('click', () => {
            showPopup(`
                <h2 class="text-dark-text text-2xl mb-4">${teacher.name_schueler || 'Unbekannt'}</h2>
                <p class="text-dark-gray"><strong class="text-dark-text">Anzeige-ID:</strong> ${teacher.anzeige_id || 'N/A'}</p>
                <p class="text-dark-gray"><strong class="text-dark-text">Fach:</strong> ${teacher.fach || 'N/A'}</p>
                <p class="text-dark-gray"><strong class="text-dark-text">Preis:</strong> €${teacher.preis ? teacher.preis.toFixed(2) : 'N/A'}</p>
                <p class="text-dark-gray"><strong class="text-dark-text">Klassenstufe:</strong> ${teacher.klassenstufe || 'N/A'}</p>
                <p class="text-dark-gray"><strong class="text-dark-text">Wochentage:</strong> ${teacher.wochentage || 'N/A'}</p>
                <p class="text-dark-gray"><strong class="text-dark-text">Kapazität:</strong> ${teacher.kapazitaet ? teacher.kapazitaet + ' Schüler' : 'N/A'}</p>
                <p class="text-dark-gray"><strong class="text-dark-text">Schüler-ID:</strong> ${teacher.schueler_id || 'N/A'}</p>
            `);
        });

        teacherList.appendChild(teacherEntry);
    });
}

// Function to fetch teacher list from server
function fetchTeacherList() {
    fetch('http://localhost:1887/api/teacher-listings')
        .then(response => {
            console.log('Fetch response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Network response was not ok: ${response.status} - ${text}`);
                });
            }
            return response.json();
        })
        .then(teachers => {
            console.log('Fetched teachers:', teachers);
            allTeachers = teachers || [];
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                renderTeacherList(allTeachers, searchInput.value || '');
            } else {
                console.error('Search input not found');
                renderTeacherList(allTeachers, '');
            }
        })
        .catch(error => {
            console.error('Detailed fetch error:', error);
            const teacherList = document.getElementById('teacher-list');
            if (teacherList) {
                teacherList.innerHTML = `<p class="text-dark-gray text-center p-4">Error loading teacher listings: ${error.message}</p>`;
            }
        });
}

// Function to show popup with content
function showPopup(content) {
    const popupOverlay = document.getElementById('popup-overlay');
    const popupContent = document.getElementById('popup-content');
    if (popupOverlay && popupContent) {
        popupContent.innerHTML = content;
        popupOverlay.classList.remove('hidden');
    } else {
        console.error('Popup elements not found');
    }
}

// Initialize app after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // Filter toggle
    const filterToggle = document.getElementById('filter-toggle');
    const filterOptions = document.getElementById('filter-options');
    if (filterToggle && filterOptions) {
        filterToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Filter toggle clicked');
            filterOptions.classList.toggle('hidden');
        });
    } else {
        console.error('Filter elements not found:', { filterToggle, filterOptions });
    }

    // Search input event listener
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            console.log('Search input changed:', e.target.value);
            renderTeacherList(allTeachers, e.target.value);
        });
    } else {
        console.error('Search input not found');
    }

    // Dropdown and slider event listeners
    const filterItems = document.querySelectorAll('.filter-item');
    filterItems.forEach(item => {
        const label = item.querySelector('.filter-label');
        const dropdown = item.querySelector('.filter-dropdown');
        const slider = item.querySelector('.filter-slider');

        if (label) {
            label.addEventListener('click', () => {
                console.log('Filter label clicked:', label.getAttribute('for'));
                if (dropdown) {
                    dropdown.classList.toggle('hidden');
                } else if (slider) {
                    slider.classList.toggle('hidden');
                }
            });
        } else {
            console.warn('Filter label not found in item:', item);
        }

        if (dropdown) {
            const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
            if (checkboxes.length > 0) { // Multi-select (Fach, Wochentage)
                checkboxes.forEach(checkbox => {
                    checkbox.addEventListener('change', () => {
                        const filterType = label.getAttribute('for');
                        filters[filterType] = Array.from(checkboxes)
                            .filter(cb => cb.checked)
                            .map(cb => cb.value);
                        label.textContent = filters[filterType].length > 0 ? 
                            filters[filterType].join(', ') : filterType.charAt(0).toUpperCase() + filterType.slice(1);
                        console.log(`Filter ${filterType} updated:`, filters[filterType]);
                        renderTeacherList(allTeachers, searchInput ? searchInput.value : '');
                    });
                });
            } else { // Single-select (Klassenstufe, Bewertung, Kapazität)
                dropdown.querySelectorAll('option').forEach(option => {
                    option.addEventListener('click', () => {
                        const filterType = label.getAttribute('for');
                        filters[filterType] = option.value;
                        console.log(`Filter ${filterType} selected:`, option.value);
                        renderTeacherList(allTeachers, searchInput ? searchInput.value : '');
                        label.textContent = option.textContent;
                        dropdown.classList.add('hidden');
                    });
                });
            }
        }

        if (slider) {
            const range = slider.querySelector('#preis-range');
            const valueSpan = slider.querySelector('#preis-value');
            if (range && valueSpan) {
                range.addEventListener('input', () => {
                    filters.preis = parseInt(range.value);
                    valueSpan.textContent = `€${range.value}`;
                    label.textContent = `Preis: €${range.value}`;
                    console.log('Price filter updated:', filters.preis);
                    renderTeacherList(allTeachers, searchInput ? searchInput.value : '');
                });
            } else {
                console.warn('Slider elements not found in:', slider);
            }
        }
    });

    // Navbar toggle
    const navbarToggle = document.getElementById('navbar-toggle');
    const navbarMenu = document.getElementById('navbar-menu');
    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Navbar toggle clicked');
            navbarMenu.classList.toggle('hidden');
        });
    } else {
        console.error('Navbar elements not found:', { navbarToggle, navbarMenu });
    }

    // "Meine Daten" popup
    const meineDatenLink = document.querySelector('#navbar-menu a[href="#"]:nth-child(1)');
    if (meineDatenLink) {
        meineDatenLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('"Meine Daten" clicked');
            showPopup(`
                <div class="bg-white">
                <div class="flex justify-center bg-green-200 p-2 rounded-t-md mx-auto">
                    <h1 class="text-center text-3xl font-semibold" style="color: #000000;">Meine Daten</h1>
                </div>
                <form>
                    <div class="mb-4 mt-2 text-center items-center justify-center">
                        <label class="block text-gray-700 mb-2" for="name">Name</label>
                        <input class="w-50 px-3 py-2 border border-gray-300 rounded-md" type="name" id="name" name="name">
                    </div>
                    <div class="mb-4 text-center items-center justify-center">
                        <label class="block text-gray-700 mb-2" for="phone_number">Telefonnummer</label>
                        <input class="w-50 px-3 py-2 border border-gray-300 rounded-md" type="phone_number" id="phone_number" name="phone_number">
                    </div>
                    <div class="mb-4 text-center items-center justify-center">
                        <label class="block text-gray-700 mb-2" for="email">E-Mail Adresse</label>
                        <input class="w-50 px-3 py-2 border border-gray-300 rounded-md" type="email" id="email" name="email">
                    </div>
                    <div class="flex justify-center mt-4">
                        <button type="submit" class="bg-green-200 border border-gray-300 rounded-md p-2 w-200">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </form>
            </div>
            `);
        });
    } else {
        console.error('"Meine Daten" link not found');
    }

    // Close popup
    const popupClose = document.getElementById('popup-close');
    const popupOverlay = document.getElementById('popup-overlay');
    if (popupClose && popupOverlay) {
        popupClose.addEventListener('click', () => {
            console.log('Popup close clicked');
            popupOverlay.classList.add('hidden');
        });

        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                console.log('Clicked outside popup, closing');
                popupOverlay.classList.add('hidden');
            }
        });
    } else {
        console.error('Popup elements not found:', { popupClose, popupOverlay });
    }

    // Fetch teacher list
    console.log('Page loaded, fetching teacher list');
    fetchTeacherList();
});