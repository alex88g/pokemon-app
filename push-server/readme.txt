Installation & Inställningar

Detta projekt använder Node.js och TypeScript. Följ stegen nedan för att komma igång.

1. Initiera projektet

npm init -y

Detta skapar en package.json med standardinställningar.


2. Installera beroenden

Installera utvecklingsberoenden för TypeScript och nodutveckling:

"npm install --save-dev ts-node-dev typescript @types/node"


ts-node-dev – kör TypeScript direkt i utvecklingsläge med automatisk omstart

typescript – kompilator för TypeScript

@types/node – typdefinitioner för Node.js


3. Starta projektet

Kör projektet i utvecklingsläge med:

npm run dev

När servern startar kommer Push-servern att lyssna på:
 http://localhost:4000


Nu är projektet klart att köras och utvecklas i TypeScript med Node.js.