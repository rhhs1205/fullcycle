import { copyFileSync, existsSync } from 'node:fs';

const destino = 'api/.env';

if (existsSync(destino)) {
  console.log(`${destino} já existe e foi mantido.`);
} else {
  copyFileSync('api/.env.example', destino);
  console.log(`${destino} criado a partir de api/.env.example.`);
}
