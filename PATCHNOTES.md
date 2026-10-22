# 📦 ScalTech CutList — Patch Notes (Wersja 1.2)

### 🚀 Nowe Funkcje

* **Wymiana zleceń Biuro ➡️ Warsztat (Eksport i Import projektu):**
  * **`💾 Zapisz Plik`** — Możliwość zapisania całego zlecenia rozkroju do pliku projektu (`.cutlist` / `.json`). Plik zawiera listę elementów, ilości, etykiety, dostępne profile magazynowe oraz parametry piły (rzaz i marginesy).
  * **`📂 Wczytaj Plik`** — Maszynista na komputerze warsztatowym może wczytać przygotowany w biurze plik jednym kliknięciem, natychmiast odtwarzając całe zlecenie i uruchamiając optymalizację.
  * **Obsługa Drag & Drop** — Dodano możliwość przeciągnięcia pliku rozpiski (`.cutlist`, `.json`, `.png`) bezpośrednio na okno przeglądarki z animowaną nakładką zrzutu.
  * **Nowy system powiadomień Toast** — Potwierdzenia zapisu i wczytania plików wyświetlane w dyskretnych powiadomieniach.

* **Eksport schematu do pliku graficznego (`🖼️ Zapisz PNG`):**
  * Generowanie i pobieranie czytelnego obrazu PNG w wysokiej rozdzielczości ze schematem cięcia, nagłówkiem zlecenia, datą wygenerowania i statystykami.
  * **Hybrydowy format pliku**: Wygenerowany plik PNG zawiera zaszyte metadane projektu ScalTech, dzięki czemu można go otworzyć jako zwykłą grafikę na telefonie/komputerze albo załadować z powrotem do programu jako interaktywny projekt.

* **Tryb Warsztatowy (Zwijanie formularzy):**
  * Dodano przycisk **`▲ Zwiń Formularze`** oraz kompaktowy pasek podsumowania (`📦 Profile | ✂️ Elementy | 📏 Rzaz`).
  * Pozwala operatorowi zwinąć formularze edycyjne podczas pracy przy pile, oddając niemal 100% powierzchni ekranu na schemat cięcia i odhaczanie rozpiski.

* **Tryb Pełnoekranowy Kiosk (`⛶ Pełny Ekran`):**
  * Dedykowany przycisk w nagłówku przełączający widok w tryb pełnoekranowy (In-App Kiosk + natywne API przeglądarki), rozszerzający obszar roboczy na 100% szerokości ekranu i maskujący elementy przeglądarki.

---

### 🖥️ Optymalizacje Układu i Responsywności

* **Dedykowany układ dla pionowych ekranów 16:9 (Portrait / Pivot / Kioski):**
  * Zoptymalizowano wyświetlanie na monitorach Full HD (1080×1920) oraz 2K (1440×2560) obróconych pionowo.
  * Formularze wejściowe (*Profile Źródłowe* oraz *Elementy do Cięcia*) wyświetlają się na samej górze w symetrycznym układzie 2-kolumnowym (`1fr 1fr`).
  * Wyniki optymalizacji, statystyki, szeroki Canvas i rozpiska warsztatowa rozciągają się bezpośrednio pod nimi na pełną szerokość ekranu.
  * Kafelki statystyk ułożono w 1 zwartym wierszu (4 kolumny), oszczędzając blisko 90 px cennej przestrzeni pionowej.

---

### 🐛 Poprawki i Usprawnienia

* **Płynne skalowanie po wyjściu z pełnego ekranu:**
  * Rozwiązano problem rozciągania i obcinania sekcji wyników po opuszczeniu trybu pełnoekranowego w orientacji poziomej.
  * Zastosowano elastyczne tory CSS Grid (`minmax(0, 1fr)`) oraz natywny `ResizeObserver`, gwarantując natychmiastowe dopasowanie Canvasu do dostępnej przestrzeni bez ucinania prawej krawędzi.
* **Poprawka zwijania formularzy w poziomie:**
  * Naprawiono błąd, w którym zwinięcie formularzy w trybie poziomym 16:9 blokowało szerokość kolumny wyników na 440 px. Teraz sekcja wyników płynnie wypełnia całą szerokość ekranu.

---

### ⚙️ Zmiany Domyślnych Parametrów

* **Szerokość cięcia (rzaz tarczy):** Zmieniono domyślną wartość z `2,0 mm` na **`1,5 mm`** w formularzu wejściowym, eksporcie, resetowaniu oraz w pasku podsumowania parametrów.
