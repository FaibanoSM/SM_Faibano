const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHACVruDK5tA48uyf2w8B3wuFHYoGZg5qkq7HeJH85Jry6mRwjUQ_jzr2twiZXVSkIskiRBMSjVBgQ/pub?gid=0&single=true&output=csv';

fetch(csvUrl)
    .then(response => response.text())
    .then(data => {
        const righe = data.split(/\r?\n/);
        let prossimaPartita = null;
        const squadre = {};
        const giornateMap = {}; // Per raggruppare le partite per giornata

        const inizializzaSquadra = (nome) => {
            if (!squadre[nome]) {
                squadre[nome] = { nome, pt: 0, g: 0, v: 0, n: 0, p: 0, gf: 0, gs: 0 };
            }
        };

        for (let i = 1; i < righe.length; i++) {
            if (!righe[i].trim()) continue;
            
            let rigaPulita = righe[i].replace(/^"|"$/g, '');
            const colonne = rigaPulita.split(',');

            const giornata = colonne[0] ? colonne[0].trim() : '1';
            const dataPartita = colonne[1] ? colonne[1].trim() : '';
            const oraPartita = colonne[2] ? colonne[2].trim() : '';
            const casa = colonne[3] ? colonne[3].trim() : '';
            const ospite = colonne[4] ? colonne[4].trim() : '';
            const golCasa = colonne[5] !== '' ? parseInt(colonne[5]) : null;
            const golOspite = colonne[6] !== '' ? parseInt(colonne[6]) : null;
            const giocata = colonne[7] ? colonne[7].trim().toUpperCase() === 'TRUE' : false;

            if (!casa || !ospite) continue;

            inizializzaSquadra(casa);
            inizializzaSquadra(ospite);

            // 1. LOGICA PROSSIMA PARTITA
            const èDelFaibano = casa.includes('S.M. Faibano') || ospite.includes('S.M. Faibano');
            if (èDelFaibano && !giocata && !prossimaPartita) {
                prossimaPartita = { giornata, data: dataPartita, ora: oraPartita, casa, ospite };
            }

            // 2. LOGICA CLASSIFICA (se giocata)
            if (giocata && !isNaN(golCasa) && !isNaN(golOspite)) {
                squadre[casa].g += 1;
                squadre[ospite].g += 1;

                squadre[casa].gf += golCasa;
                squadre[casa].gs += golOspite;

                squadre[ospite].gf += golOspite;
                squadre[ospite].gs += golCasa;

                if (golCasa > golOspite) {
                    squadre[casa].pt += 3;
                    squadre[casa].v += 1;
                    squadre[ospite].p += 1;
                } else if (golCasa < golOspite) {
                    squadre[ospite].pt += 3;
                    squadre[ospite].v += 1;
                    squadre[casa].p += 1;
                } else {
                    squadre[casa].pt += 1;
                    squadre[ospite].pt += 1;
                    squadre[casa].n += 1;
                    squadre[ospite].n += 1;
                }
            }

            // 3. RACCOLTA INCONTRI PER GIORNATA
            if (!giornateMap[giornata]) {
                giornateMap[giornata] = [];
            }
            giornateMap[giornata].push({
                data: dataPartita,
                ora: oraPartita,
                casa,
                ospite,
                golCasa,
                golOspite,
                giocata
            });
        }

        // --- RENDER PROSSIMA PARTITA ---
        const boxPartita = document.getElementById('info-partita');
        if (boxPartita && prossimaPartita) {
            boxPartita.innerHTML = `
                <p style="font-size: 14px; color: #A78BFA; margin-bottom: 5px;">Giornata ${prossimaPartita.giornata}</p>
                <p style="font-weight: bold; font-size: 20px; margin: 10px 0;">
                    ${prossimaPartita.casa} vs ${prossimaPartita.ospite}
                </p>
                <p style="font-size: 15px; color: #D1D5DB;">📅 ${prossimaPartita.data} ⏰ ${prossimaPartita.ora}</p>
            `;
        } else if (boxPartita) {
            boxPartita.innerHTML = `<p>Nessuna partita in programma trovata.</p>`;
        }

        // --- RENDER CLASSIFICA ---
        const classificaOrdinata = Object.values(squadre).sort((a, b) => {
            if (b.pt !== a.pt) return b.pt - a.pt;
            const drA = a.gf - a.gs;
            const drB = b.gf - b.gs;
            if (drB !== drA) return drB - drA;
            return b.gf - a.gf;
        });

        const corpoClassifica = document.getElementById('corpo-classifica');
        if (corpoClassifica) {
            corpoClassifica.innerHTML = '';

            classificaOrdinata.forEach((sq, index) => {
                const dr = sq.gf - sq.gs;
                const drTesto = dr > 0 ? `+${dr}` : dr;
                const classeRiga = sq.nome.includes('S.M. Faibano') ? 'class="riga-faibano"' : '';

                // Ordine colonne allineato con index.html: Pos, Squadra, G, PT, GF, GS, DR
                corpoClassifica.innerHTML += `
                    <tr ${classeRiga}>
                        <td>${index + 1}</td>
                        <td>${sq.nome}</td>
                        <td>${sq.g}</td>
                        <td><strong>${sq.pt}</strong></td>
                        <td>${sq.gf}</td>
                        <td>${sq.gs}</td>
                        <td>${drTesto}</td>
                    </tr>
                `;
            });
        }

        // --- RENDER INCONTRI (Contenitore unico ordinato) ---
        const incontriContainer = document.getElementById('incontri-container');

        if (incontriContainer) {
            incontriContainer.innerHTML = '';

            // Ordiniamo le giornate in ordine numerico crescente (1, 2, 3, 4...)
            const numeriGiornate = Object.keys(giornateMap).sort((a, b) => parseInt(a) - parseInt(b));

            numeriGiornate.forEach(numGiornata => {
                let htmlPartite = '';

                giornateMap[numGiornata].forEach(p => {
                    let stringaRisultato = '';
                    if (p.giocata && p.golCasa !== null && p.golOspite !== null) {
                        stringaRisultato = `<span style="color: #34D399; font-weight: bold;">(${p.golCasa} - ${p.golOspite})</span>`;
                    } else {
                        stringaRisultato = `<span style="color: #A78BFA;">vs</span>`;
                    }

                    htmlPartite += `
                        <div class="partita-item">
                            <span class="partita-info">📅 ${p.data} ⏰ ${p.ora}</span>
                            <span class="partita-squadre">${p.casa} ${stringaRisultato} ${p.ospite}</span>
                        </div>
                    `;
                });

                incontriContainer.innerHTML += `
                    <div class="giornata-card">
                        <h3>Giornata ${numGiornata}</h3>
                        ${htmlPartite}
                    </div>
                `;
            });
        }
    })
    .catch(error => {
        console.error('Errore nel caricamento dei dati:', error);
    });