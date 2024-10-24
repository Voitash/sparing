// Czekamy na załadowanie dokumentu
document.addEventListener('DOMContentLoaded', () => {
    // Pobieramy referencje do wszystkich potrzebnych elementów
    const generateButton = document.getElementById('generateButton');
    const clearButton = document.getElementById('clearButton');
    const exportButton = document.getElementById('exportButton');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const athletesDataField = document.getElementById('athletesData');
    const weightDifferenceRange = document.getElementById('weightDifferenceRange');
    const weightDifferenceValue = document.getElementById('weightDifferenceValue');
    const numMatchesRadios = document.getElementsByName('numMatches');
    const numMatsRadios = document.getElementsByName('numMats');

    // Aktualizuj wyświetlaną wartość różnicy wag
    weightDifferenceRange.addEventListener('input', () => {
        weightDifferenceValue.textContent = `${weightDifferenceRange.value} kg`;
    });

    // Funkcja pomocnicza do pobierania wartości z radio buttons
    const getSelectedRadioValue = (radioButtons) => {
        for (const radio of radioButtons) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return null;
    };

    // Funkcja do przetwarzania danych zawodników
    const processAthletesData = (data) => {
        return data.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                const parts = line.split(/[\t,]+/); // Obsługa zarówno tabulatorów jak i przecinków
                const name = parts.slice(0, -1).join(' '); // Łączy wszystkie części oprócz ostatniej jako imię i nazwisko
                const weight = parseFloat(parts[parts.length - 1]);
                return { name: name.trim(), weight };
            })
            .filter(athlete => !isNaN(athlete.weight)); // Filtruje nieprawidłowe wpisy
    };

    // Główna funkcja generująca losowanie
    const generateDraw = (e) => {
        e.preventDefault();

        // Pobieranie i walidacja danych wejściowych
        const athletesData = athletesDataField.value;
        const weightDifference = parseInt(weightDifferenceRange.value);
        const numMatches = parseInt(getSelectedRadioValue(numMatchesRadios));
        const numMats = parseInt(getSelectedRadioValue(numMatsRadios));

        // Sprawdzanie czy wszystkie dane zostały wprowadzone
        if (!athletesData || !weightDifference || !numMatches || !numMats) {
            alert('Proszę wypełnić wszystkie pola formularza.');
            return;
        }

        // Przetwarzanie danych zawodników
        const athletes = processAthletesData(athletesData);
        if (athletes.length < 2) {
            alert('Wprowadź co najmniej dwóch zawodników.');
            return;
        }

        // Czyszczenie poprzednich wyników
        resultsTableBody.innerHTML = '';

        // Inicjalizacja struktur danych do śledzenia walk
        const matchesCount = new Map();
        athletes.forEach(athlete => matchesCount.set(athlete, 0));
        const matches = [];
        const noOpponentAthletes = [];
        const matUsage = Array(numMats).fill(0); // Śledzenie liczby walk na każdej macie

        // Funkcja pomocnicza do znajdowania przeciwników
        const findOpponent = (athlete) => {
            return athletes.filter(op => 
                op !== athlete && 
                Math.abs(op.weight - athlete.weight) <= weightDifference &&
                matchesCount.get(op) < numMatches
            );
        };

        // Pierwsza faza - zapewnienie każdemu zawodnikowi przynajmniej jednej walki
        for (const athlete of athletes) {
            if (matchesCount.get(athlete) === 0) {
                const availableOpponents = findOpponent(athlete);

                if (availableOpponents.length > 0) {
                    const opponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
                    const mat = matUsage.indexOf(Math.min(...matUsage)) + 1; // Wybierz matę z najmniejszą liczbą walk
                    matches.push({
                        athlete1: athlete,
                        athlete2: opponent,
                        mat: mat
                    });
                    matchesCount.set(athlete, matchesCount.get(athlete) + 1);
                    matchesCount.set(opponent, matchesCount.get(opponent) + 1);
                    matUsage[mat - 1]++;
                } else {
                    noOpponentAthletes.push(athlete);
                }
            }
        }

        // Druga faza - dodatkowe walki do osiągnięcia żądanej liczby
        for (const athlete of athletes) {
            while (matchesCount.get(athlete) < numMatches) {
                const availableOpponents = findOpponent(athlete);

                if (availableOpponents.length > 0) {
                    const opponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
                    const mat = matUsage.indexOf(Math.min(...matUsage)) + 1; // Wybierz matę z najmniejszą liczbą walk
                    matches.push({
                        athlete1: athlete,
                        athlete2: opponent,
                        mat: mat
                    });
                    matchesCount.set(athlete, matchesCount.get(athlete) + 1);
                    matchesCount.set(opponent, matchesCount.get(opponent) + 1);
                    matUsage[mat - 1]++;
                } else {
                    break;
                }
            }
        }

        // Trzecia faza - przydzielanie dodatkowych walk, aby zminimalizować "brak przeciwnika"
        for (const athlete of noOpponentAthletes) {
            const availableOpponents = findOpponent(athlete);

            if (availableOpponents.length > 0) {
                const opponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
                const mat = matUsage.indexOf(Math.min(...matUsage)) + 1; // Wybierz matę z najmniejszą liczbą walk
                matches.push({
                    athlete1: athlete,
                    athlete2: opponent,
                    mat: mat
                });
                matchesCount.set(athlete, matchesCount.get(athlete) + 1);
                matchesCount.set(opponent, matchesCount.get(opponent) + 1);
                matUsage[mat - 1]++;
            }
        }

        // Sortowanie walk według numeru maty
        matches.sort((a, b) => a.mat - b.mat);

        // Wyświetlanie wyników
        const matchNumbers = {}; // Obiekt do śledzenia numeracji walk na każdej macie

        matches.forEach((match, index) => {
            // Inicjalizacja numeracji dla każdej maty
            if (!matchNumbers[match.mat]) {
                matchNumbers[match.mat] = match.mat * 100 + 1; // Zaczynamy od 101, 201, itd.
            }

            const row = document.createElement('tr');
            // Dodaj klasę dla parzystych mat
            if (match.mat % 2 === 0) {
                row.classList.add('even-mat');
            }
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>Walka ${matchNumbers[match.mat]}</td> <!-- Numer walki na macie -->
                <td class="${matchesCount.get(match.athlete1) > numMatches ? 'extra-matches' : ''}">${match.athlete1.name} (${match.athlete1.weight})</td>
                <td class="${matchesCount.get(match.athlete2) > numMatches ? 'extra-matches' : ''}">${match.athlete2.name} (${match.athlete2.weight})</td>
                <td>Mata ${match.mat}</td>
            `;
            resultsTableBody.appendChild(row);

            // Zwiększ numer walki dla danej maty
            matchNumbers[match.mat]++;
        });

        // Wyświetlanie zawodników bez przeciwników
        noOpponentAthletes.forEach((athlete, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${matches.length + index + 1}</td>
                <td>-</td> <!-- Puste pole dla numeru walki -->
                <td class="no-opponent">${athlete.name} (${athlete.weight})</td>
                <td>Brak przeciwnika</td>
                <td>-</td>
            `;
            resultsTableBody.appendChild(row);
        });

        // Zapisanie wyników w localStorage
        localStorage.setItem('lastDraw', JSON.stringify(athletes));
    };

    // Funkcja czyszcząca wyniki
    const clearDraw = (e) => {
        e.preventDefault();
        resultsTableBody.innerHTML = '';
        localStorage.removeItem('lastDraw');
    };

    // Funkcja eksportu do Excela
    const exportToExcel = (e) => {
        e.preventDefault();
        
        if (!resultsTableBody.hasChildNodes()) {
            alert('Brak danych do eksportu. Najpierw wygeneruj losowanie.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const table = document.querySelector('table');
        const ws = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(wb, ws, "Sparingi");
        XLSX.writeFile(wb, "sparing.xlsx");
    };

    // Dodanie event listenerów do przycisków
    generateButton.addEventListener('click', generateDraw);
    clearButton.addEventListener('click', clearDraw);
    exportButton.addEventListener('click', exportToExcel);

    // Załadowanie poprzedniego losowania jeśli istnieje
    const lastDraw = localStorage.getItem('lastDraw');
    if (lastDraw) {
        athletesDataField.value = JSON.parse(lastDraw)
            .map(athlete => `${athlete.name}\t${athlete.weight}`)
            .join('\n');
    }
});
