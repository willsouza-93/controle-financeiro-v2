# Controle Financeiro Local

Aplicação 100% frontend para controle financeiro local de pequenos negócios.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
npm run preview
```

## Persistência localStorage

Todos os dados (transações, encomendas e configurações) são salvos exclusivamente no navegador usando `localStorage`.

## Backup

Na aba **Backup** você pode:
- Exportar JSON com todos os dados;
- Importar JSON para restauração;
- Limpar todos os dados locais.

> Os dados ficam salvos apenas neste navegador. Exporte um backup regularmente.

## PWA

O projeto possui `manifest.webmanifest` e `service worker` para instalação e cache básico offline após o primeiro carregamento.

## Deploy simples

### Vercel
1. Importar repositório na Vercel.
2. Build command: `npm run build`
3. Output: `dist`

### GitHub Pages
1. Rodar `npm run build`
2. Publicar pasta `dist` com GitHub Pages (via Actions ou branch `gh-pages`).
