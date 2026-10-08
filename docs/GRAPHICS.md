# Figurenstil B

Die Spielfiguren stammen aus dem ausgewählten Entwurf B. Die ursprüngliche Darstellung aus Rechtecken wurde durch ein transparentes Sprite-Bild ersetzt:

- Bild: `web/assets/characters-b.png`, 1254 × 1254 Pixel, transparentes PNG.
- Renderer: `web/characters.js`; Ausschnitte für Spielfigur, Jona und Mina, jeweils vorne, rechts und hinten. Links ist die gespiegelte rechte Ansicht.
- Die Füße bewegen sich beim Laufen abwechselnd. „Weniger Bewegung“ deaktiviert die Animation.
- Das Bild wird über den Service Worker offline gespeichert und mit den Android-Assets synchronisiert.

## Erstellung

Erstellt mit dem eingebauten Imagegen-Werkzeug anhand der mittleren Spalte B der Figurenübersicht. Der verwendete Prompt:

> Create a production sprite atlas using ONLY the middle-column B designs of the reference image. Transparent background, no text, no grid lines, no scenery, no ground or shadows. Exactly THREE ROWS and THREE COLUMNS of isolated full-body sprites, nine figures total, equal-sized cells. Canvas square, each cell one third width and height. Sprites centered horizontally in each cell, feet at 90% of each cell height, ample transparent padding. Row1: same brown-haired young adventurer with cream laced tunic, dark pants, brown boots and red backpack from B. Row2: same elderly bald grey-haired bearded villager wearing olive shirt and brown apron from B. Row3: same brown-haired bun-haired woman with olive blouse and cream apron from B. Columns: column1 front facing viewer, column2 profile facing RIGHT, column3 rear facing away. CONSISTENT sprite size across all rows, consistent scale, same figure proportions across directions. Match style B faithfully: finely detailed pixel-art/chibi proportions, large friendly expressive eyes, natural rounded face, tousled hair locks, warm muted earthy colors, crisp stepped pixel edges, small nuanced highlights and cloth folds. Elevated top-down RPG camera like the reference, not flat side-on realism. Each sprite about 70% of cell height and 50% cell width. Do not reproduce columns A or C, no poster headings, no letters, no decoration. Atlas is intended to be cropped into equal thirds at runtime.

Die tatsächlichen Sprites liegen nicht exakt auf einem gleichmäßigen Raster. Deshalb verwendet der Renderer gemessene Ausschnitte mit transparentem Rand statt pauschaler Drittelung. Das Originalbild bleibt unverändert.
