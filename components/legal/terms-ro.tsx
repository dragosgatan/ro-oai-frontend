export function TermsRO({ privacyHref }: { privacyHref: string }) {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="prose prose-lg max-w-none">
                <p className="text-sm text-muted-foreground mb-8">
                    Ultima actualizare: 17 noiembrie 2025
                </p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Acceptarea Termenilor</h2>
                    <p className="mb-4">
                        Prin accesarea și utilizarea platformei Olimpiada Națională de Inteligență
                        Artificială (denumită în continuare "Platforma"), sunteți de acord să
                        respectați și să fiți legat de acești Termeni și Condiții. Dacă nu sunteți
                        de acord cu acești termeni, vă rugăm să nu utilizați Platforma.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Descrierea Serviciului</h2>
                    <p className="mb-4">
                        Platforma oferă un mediu educațional pentru participanții la Olimpiada
                        Națională de Inteligență Artificială, incluzând:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Acces la probleme și exerciții de inteligență artificială</li>
                        <li>Sistem de evaluare automată a soluțiilor</li>
                        <li>Clasamente și statistici</li>
                        <li>Forum de discuții și întrebări</li>
                        <li>Materiale educaționale și resurse</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. Înregistrarea Contului</h2>
                    <h3 className="text-xl font-semibold mb-3">3.1 Eligibilitate</h3>
                    <p className="mb-4">
                        Pentru a utiliza Platforma, trebuie să aveți cel puțin 13 ani sau să aveți
                        consimțământul părinților/tutorilor legali dacă aveți sub 18 ani.
                    </p>

                    <h3 className="text-xl font-semibold mb-3">3.2 Informații de Cont</h3>
                    <p className="mb-4">Sunteți responsabil pentru:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Furnizarea de informații corecte și complete la înregistrare</li>
                        <li>Menținerea securității contului și parolei dvs.</li>
                        <li>Toate activitățile care au loc sub contul dvs.</li>
                        <li>Notificarea imediată a oricărei utilizări neautorizate a contului</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">4. Utilizarea Platformei</h2>
                    <h3 className="text-xl font-semibold mb-3">4.1 Utilizare Permisă</h3>
                    <p className="mb-4">Vă este permis să:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Accesați și rezolvați problemele disponibile</li>
                        <li>Trimiteți soluții pentru evaluare</li>
                        <li>Participați la discuții și forumuri</li>
                        <li>Vizualizați clasamentele și statisticile</li>
                        <li>Utilizați materialele educaționale în scopuri personale</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3">4.2 Utilizare Interzisă</h3>
                    <p className="mb-4">Este strict interzis să:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Copiați sau plagiați soluțiile altor utilizatori</li>
                        <li>Încercați să compromiteți securitatea Platformei</li>
                        <li>Utilizați scripturi automate sau boți pentru a trimite soluții</li>
                        <li>
                            Distribuiți sau publicați soluțiile problemelor în timpul competițiilor
                        </li>
                        <li>Hărțuiți, amenințați sau discriminați alți utilizatori</li>
                        <li>Încărcați conținut ilegal, ofensator sau inadecvat</li>
                        <li>Încercați să accesați conturile altor utilizatori</li>
                        <li>Utilizați Platforma în scopuri comerciale fără autorizație</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">5. Proprietate Intelectuală</h2>
                    <h3 className="text-xl font-semibold mb-3">5.1 Conținutul Platformei</h3>
                    <p className="mb-4">
                        Toate problemele, materialele educaționale, designul și conținutul
                        Platformei sunt proprietatea Olimpiadei Naționale de Inteligență Artificială
                        și sunt protejate de legile privind drepturile de autor.
                    </p>

                    <h3 className="text-xl font-semibold mb-3">5.2 Conținutul Utilizatorilor</h3>
                    <p className="mb-4">
                        Prin trimiterea de soluții, comentarii sau alte conținuturi pe Platformă:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Păstrați drepturile de autor asupra codului dvs.</li>
                        <li>
                            Acordați Platformei o licență non-exclusivă de a utiliza, stoca și afișa
                            conținutul
                        </li>
                        <li>Garantați că aveți dreptul de a publica conținutul respectiv</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">6. Evaluarea și Clasamentele</h2>
                    <h3 className="text-xl font-semibold mb-3">6.1 Sistem de Evaluare</h3>
                    <p className="mb-4">
                        Soluțiile sunt evaluate automat pe baza unor teste predefinite. Decizia
                        sistemului de evaluare este finală, cu excepția cazurilor în care se
                        identifică erori tehnice.
                    </p>

                    <h3 className="text-xl font-semibold mb-3">6.2 Clasamente</h3>
                    <p className="mb-4">
                        Clasamentele sunt calculate pe baza punctajelor obținute. Ne rezervăm
                        dreptul de a:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Elimina din clasament utilizatorii care încalcă regulile</li>
                        <li>Ajusta punctajele în caz de erori tehnice</li>
                        <li>Modifica algoritmul de calcul al clasamentelor</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        7. Confidențialitate și Protecția Datelor
                    </h2>
                    <p className="mb-4">
                        Colectăm și procesăm datele dvs. personale în conformitate cu Regulamentul
                        General privind Protecția Datelor (GDPR). Pentru detalii complete,
                        consultați{' '}
                        <a href={privacyHref} className="text-primary hover:underline">
                            Politica de Confidențialitate
                        </a>
                        .
                    </p>
                    <p className="mb-4">Datele colectate includ:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Informații de cont (nume, email, instituție)</li>
                        <li>Soluțiile trimise și rezultatele evaluărilor</li>
                        <li>Activitatea pe platformă (accesări, comentarii)</li>
                        <li>Date tehnice (adresă IP, browser, dispozitiv)</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">8. Competiții și Evenimente</h2>
                    <h3 className="text-xl font-semibold mb-3">8.1 Reguli Specifice</h3>
                    <p className="mb-4">
                        Fiecare competiție poate avea reguli suplimentare specifice care vor fi
                        comunicate participanților înainte de începerea competiției.
                    </p>

                    <h3 className="text-xl font-semibold mb-3">8.2 Descalificare</h3>
                    <p className="mb-4">Participanții pot fi descalificați pentru:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Încălcarea regulilor competiției</li>
                        <li>Colaborare neautorizată cu alți participanți</li>
                        <li>Utilizarea de resurse externe interzise</li>
                        <li>Comportament nesportiv</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">9. Limitarea Răspunderii</h2>
                    <p className="mb-4">
                        Platforma este furnizată "ca atare" fără garanții de niciun fel. Nu
                        garantăm:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Disponibilitatea continuă a Platformei</li>
                        <li>Absența erorilor sau întreruperi</li>
                        <li>Corectitudinea absolută a evaluărilor</li>
                        <li>Securitatea completă împotriva atacurilor</li>
                    </ul>
                    <p className="mb-4">Nu suntem responsabili pentru:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Pierderea de date sau punctaje din cauze tehnice</li>
                        <li>Daune indirecte sau consecințe ale utilizării Platformei</li>
                        <li>Conținutul generat de utilizatori</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        10. Suspendarea și Închiderea Contului
                    </h2>
                    <p className="mb-4">
                        Ne rezervăm dreptul de a suspenda sau închide contul dvs. în cazul în care:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Încălcați acești Termeni și Condiții</li>
                        <li>Furnizați informații false sau înșelătoare</li>
                        <li>Utilizați Platforma în mod abuziv</li>
                        <li>Contul este inactiv pentru o perioadă prelungită</li>
                    </ul>
                    <p className="mb-4">
                        Puteți solicita ștergerea contului dvs. oricând prin contactarea echipei de
                        suport.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">11. Modificări ale Termenilor</h2>
                    <p className="mb-4">
                        Ne rezervăm dreptul de a modifica acești Termeni și Condiții în orice
                        moment. Modificările vor fi comunicate prin:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Notificare pe Platformă</li>
                        <li>Email către utilizatorii înregistrați</li>
                        <li>Actualizarea datei "Ultima actualizare"</li>
                    </ul>
                    <p className="mb-4">
                        Continuarea utilizării Platformei după modificări constituie acceptarea
                        noilor termeni.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">12. Legea Aplicabilă</h2>
                    <p className="mb-4">
                        Acești Termeni și Condiții sunt guvernați de legile României. Orice dispută
                        va fi soluționată de instanțele competente din România.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
                    <p className="mb-4">
                        Pentru întrebări sau nelămuriri legate de acești Termeni și Condiții, ne
                        puteți contacta la:
                    </p>
                    <ul className="list-none pl-0 mb-4 space-y-2">
                        <li>
                            <strong>Email:</strong>{' '}
                            <a
                                href="mailto:contact@olimpiada-ai.ro"
                                className="text-primary hover:underline"
                            >
                                contact@olimpiada-ai.ro
                            </a>
                        </li>
                        <li>
                            <strong>Website:</strong>{' '}
                            <a
                                href="https://olimpiada-ai.ro"
                                className="text-primary hover:underline"
                            >
                                https://olimpiada-ai.ro
                            </a>
                        </li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">14. Dispoziții Finale</h2>
                    <p className="mb-4">
                        Dacă o prevedere a acestor Termeni și Condiții este considerată invalidă sau
                        inaplicabilă, celelalte prevederi rămân în vigoare.
                    </p>
                    <p className="mb-4">
                        Neexercitarea unui drept sau a unei prevederi din acești termeni nu
                        constituie o renunțare la acel drept sau prevedere.
                    </p>
                </section>

                <div className="mt-12 p-6 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        Prin utilizarea Platformei Olimpiada Națională de Inteligență Artificială,
                        confirmați că ați citit, înțeles și acceptat acești Termeni și Condiții în
                        totalitate.
                    </p>
                </div>
            </div>
        </div>
    );
}
