// Inserisci qui il link CSV specifico della SECONDA tab del tuo Google Sheets
const csvUrlRosa = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHACVruDK5tA48uyf2w8B3wuFHYoGZg5qkq7HeJH85Jry6mRwjUQ_jzr2twiZXVSkIskiRBMSjVBgQ/pub?gid=1687384445&single=true&output=csv';

fetch(csvUrlRosa)
    .then(response => response.text())
    .then(data => {
        const righe = data.split(/\r?\n/);
        const grigliaSquadra = document.getElementById('squadra-container');

        if (!grigliaSquadra) return;
        grigliaSquadra.innerHTML = '';

        // Partiamo da i = 1 per saltare l'intestazione della tabella
        for (let i = 1; i < righe.length; i++) {
            if (!righe[i].trim()) continue;
            
            let rigaPulita = righe[i].replace(/^"|"$/g, '');
            const colonne = rigaPulita.split(',');

            const nome = colonne[0] ? colonne[0].trim() : '';
            const cognome = colonne[1] ? colonne[1].trim() : '';
            const ruolo = colonne[2] ? colonne[2].trim() : '';
            const gol = colonne[3] ? colonne[3].trim() : '0';
            const gialli = colonne[4] ? colonne[4].trim() : '0';
            const rossi = colonne[5] ? colonne[5].trim() : '0';

            if (!nome || !cognome) continue;

            // Immagine predefinita (logo della squadra in attesa di foto reali)
            const fotoDefault = 'Faccia.png'; 

            // Generazione della card con i dati presi da Google Sheets
            grigliaSquadra.innerHTML += `
                <div class="giocatore-card">
                    <img src="${fotoDefault}" alt="${nome} ${cognome}" class="giocatore-img">
                    <div class="giocatore-info">
                        <h3>${nome} ${cognome}</h3>
                        <p class="giocatore-ruolo">${ruolo}</p>
                        <p style="font-size: 12px; color: #D1D5DB; margin-top: 5px;">
                            ⚽ Gol: ${gol} | 🟨 ${gialli} | 🟥 ${rossi}
                        </p>
                    </div>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Errore nel caricamento della rosa:', error);
});