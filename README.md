# ✂️ ScalTech CutList — Inteligentny Optymalizator Cięcia Profili

[![Wersja](https://img.shields.io/badge/wersja-1.2-blue.svg)](https://github.com/)
[![Licencja](https://img.shields.io/badge/licencja-MIT-green.svg)](LICENSE)
[![Platforma](https://img.shields.io/badge/platforma-Web%20%7C%20Offline-orange.svg)](https://github.com/)
[![Responsywność](https://img.shields.io/badge/ekrany-16%3A9%20Poziom%20%26%20Pion%20(Pivot)-purple.svg)](https://github.com/)

**ScalTech CutList** to profesjonalna, lekka i bezinstalacyjna aplikacja webowa do **jednowymiarowej (1D) optymalizacji rozkroju materiałów liniowych**. Została zaprojektowana z myślą o zakładach ślusarskich, stolarniach, producentach konstrukcji aluminiowych, halach montażowych oraz majsterkowiczach.

Pozwala w kilka sekund ułożyć elementy do wycięcia w dostępnych profilach magazynowych tak, aby **zminimalizować odpad materiałowy**, skrócić czas pracy przy pile i obniżyć koszty produkcji.

---

## 📸 Główne Funkcje i Możliwości

### 🧠 1. Inteligentne Algorytmy Upakowania (1D Bin Packing)
* **FFD (First Fit Decreasing)** — szybki, sprawdzony algorytm sortujący elementy od najdłuższych i upychający je w pierwszym profilu, w którym się zmieszczą.
* **BFD (Best Fit Decreasing)** — algorytm szukający profilu, w którym po włożeniu elementu zostanie jak najmniejsza resztka (maksymalizacja ciasnego upakowania).
* **Obsługa wielu profili magazynowych jednocześnie** — możesz zdefiniować różne dostępne długości handlowe (np. 6000 mm, 3000 mm, 2000 mm) wraz z ich dostępną liczbą sztuk.
* **Wykrywanie braków magazynowych** — jeśli zabraknie materiału, aplikacja automatycznie wylicza zapotrzebowanie na dodatkowe profile i ostrzega użytkownika.

### ⚙️ 2. Realia Warsztatowe (Rzaz i Marginesy)
* **Szerokość cięcia / Rzaz piły (`cutThickness`)** — uwzględnia grubość tarczy tnącej (domyślnie **1,5 mm**). Każde cięcie odejmuje zadaną wartość z materiału.
* **Margines brzegowy (`edgeTrim`)** — margines na odcięcie nierównych lub uszkodzonych końców fabrycznych profilu przed właściwym rozkrojem.

### 📊 3. Interaktywny Schemat Cięcia & Raport Warsztatowy
* **Wizualizacja Canvas w wysokiej rozdzielczości**:
  * Kolorowe kodowanie poszczególnych pozycji z podanymi wymiarami.
  * Oznaczenie rzazów tarczy oraz resztek/odpadu.
  * **Interaktywne odhaczanie cięć**: kliknięcie lub dotknięcie elementu na wykresie oznacza go jako wycięty (szary z symbolem `✓`).
* **Rozpiska Cięć Warsztatowych**:
  * Lista cięć krok po kroku dla każdego profilu.
  * Klikalne chipy do śledzenia postępu prac przy maszynie (`Postęp: X / Y szt.`).
  * Przycisk szybkiego kopiowania rozpiski do schowka.
  * Generowanie estetycznego raportu warsztatowego do druku lub pliku PDF (`Ctrl + P`).

### 🔄 4. Wymiana Danych: Biuro ➡️ Warsztat
Aplikacja rozwiązuje problem komunikacji między technologiem/konstruktorem w biurze a maszynistą przy pile:
* **`💾 Zapisz Plik` (`.cutlist` / `.json`)**: Zapis kompletnego projektu do pliku jednym kliknięciem (zawiera profile magazynowe, elementy, etykiety, rzaz i marginesy).
* **`📂 Wczytaj Plik`**: Maszynista na stanowisku roboczym otwiera plik z maila, pendrive'a lub dysku sieciowego, a aplikacja natychmiast odtwarza całe zlecenie i uruchamia optymalizację.
* **`🖼️ Zapisz PNG` (Hybrydowy obraz)**: Generuje grafikę PNG w wysokiej rozdzielczości z nagłówkiem zlecenia, datą, parametrami i schematem cięcia. **Plik posiada zaszyte metadane projektu** — maszynista może otworzyć go jako zwykły obrazek lub załadować bezpośrednio w programie!
* **Pełne wsparcie Drag & Drop**: Przeciągnij i upuść plik `.cutlist`, `.json` lub wyeksportowany `.png` wprost na okno przeglądarki.

### 🖥️ 5. Zoptymalizowany pod Ekrany Pionowe 16:9 (Pivot / Kioski)
* W warsztatach często stosuje się monitory obrócone pionowo (1080×1920 lub 1440×2560) przy pilarce.
* **Układ pionowy**: Formularze wejściowe prezentowane są w symetrycznym rzędzie u góry (`1fr 1fr`), a pod nimi znajduje się szeroki schemat cięcia i rozpiska.
* **Tryb Warsztatowy (`▲ Zwiń Formularze`)**: Zwijanie paneli edycyjnych do wąskiego paska informacyjnego oddaje niemal 100% wysokości ekranu na schemat cięcia.
* **Tryb Pełnoekranowy (`⛶ Pełny Ekran`)**: Przełącza aplikację w tryb kiosku (100% szerokości ekranu, bez pasków przeglądarki).
* **Pełna responsywność**: Zachowuje klasyczny układ 2-kolumnowy na monitorach poziomych (1920×1080) oraz widok jednokolumnowy na smartfonach.

---

## 🛠️ Zastosowanie

Program doskonale sprawdza się przy cięciu:
* Profili stalowych, aluminiowych i nierdzewnych (np. profile zamknięte, kątowniki, ceowniki, teowniki).
* Rur metalowych i PCV / PEX.
* Drewna, belek, kantówek, łat dachowych, listew przypodłogowych.
* Prętów gwintowanych i zbrojeniowych.
* Korytek i listew elektroinstalacyjnych oraz profili LED.

---

## 🚀 Szybki Start (Instalacja i Uruchomienie)

Aplikacja **nie wymaga instalacji, serwera ani środowiska Node.js**. Działa bezpośrednio w dowolnej nowoczesnej przeglądarce internetowej (Chrome, Edge, Firefox, Safari, Opera).

1. **Pobierz repozytorium**:
   ```bash
   git clone https://github.com/twoj-login/scaltech-cutlist.git
   ```
   *(lub pobierz archiwum ZIP i rozpakuj)*.

2. **Uruchom**:
   Kliknij dwukrotnie plik **`index.html`** w eksploratorze plików.

3. **Działa w 100% offline**:
   Do działania nie jest wymagane połączenie z internetem — idealne rozwiązanie na halę produkcyjną bez dostępu do sieci.

---

## 📖 Instrukcja Obsługi (Krok po Kroku)

1. **Zdefiniuj materiał źródłowy (Stock)**:
   Wprowadź długość profili, którymi dysponujesz (np. 6000 mm) oraz ich dostępną ilość. Możesz dodać kilka różnych długości profili lub skorzystać z przycisków szybkiego wyboru.
2. **Ustaw parametry cięcia**:
   Podaj grubość tarczy piły (domyślnie 1,5 mm) oraz margines na wyrównanie krawędzi profilu (np. 10 mm).
3. **Dodaj elementy do wycięcia**:
   Wpisz długość żądanego elementu, ilość sztuk oraz opcjonalną etykietę (np. `Noga ramy`, `Poprzeczka`). Kliknij `Dodaj Element do Listy` (lub wciśnij Enter).
4. **Odczytaj optymalizację**:
   Program automatycznie przelicza rozkrój, wyświetla statystyki (zużyty materiał, procent wydajności, całkowity odpad, liczba użytych profili) oraz generuje graficzny schemat cięcia.
5. **Eksportuj zlecenie dla warsztatu**:
   * Kliknij **`💾 Zapisz Plik`**, aby wygenerować plik `.cutlist`.
   * Lub kliknij **`🖼️ Zapisz PNG`**, aby pobrać schemat graficzny.
6. **Realizacja cięcia**:
   Na komputerze przy pile kliknij **`📂 Wczytaj Plik`** lub przeciągnij plik rozpiski na ekran. Przy kolejnych cięciach odhaczaj elementy kliknięciem, aby kontrolować postęp pracy.

---

## 💻 Stos Technologiczny

* **HTML5**: Semantyczna struktura, formularze, obsługa przeciągania plików (Drag & Drop API).
* **CSS3**: Zmienne CSS (Custom Properties), CSS Grid (`minmax()`), Flexbox, Glassmorphism, zaawansowane reguły `@media` pod monitory pionowe 16:9 oraz style wydruku (`@media print`).
* **Vanilla JavaScript (ES6+)**:
  * Silnik optymalizacyjny 1D Bin Packing (algorytmy heurystyczne FFD / BFD).
  * HTML5 Canvas API ze wsparciem dla wysokich gęstości pikseli (DPI / Retina).
  * `ResizeObserver` dla dynamicznego i bezbłędnego skalowania grafiki.
  * `FileReader` oraz `Blob API` do obsługi importu/eksportu plików i wstrzykiwania metadanych do PNG.
  * Pełne wsparcie dla Fullscreen API.

---

## 📁 Struktura Projektu

```text
ScalTech CutList/
├── index.html        # Główny dokument aplikacji i interfejs użytkownika
├── style.css         # Style graficzne, motyw Dark Mode, responsywność i wydruk
├── app.js            # Silnik optymalizacji, obsługa Canvas, eksport/import i interakcje
├── PATCHNOTES.md     # Historia zmian i wykaz nowości w poszczególnych wersjach
└── README.md         # Dokumentacja projektu
```

---

## 📄 Licencja

Projekt udostępniany jest na warunkach licencji **MIT**. Szczegóły w pliku [LICENSE](LICENSE).

---

<div align="center">
  <sub>Stworzone z dbałością o detale i ergonomię pracy warsztatowej. &copy; 2026 ScalTech Optimization Suite.</sub>
</div>
