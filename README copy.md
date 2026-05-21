# API Pokémon

Aplicativo mobile desenvolvido em React Native com Expo para consulta de informações sobre Pokémon usando a [PokeAPI](https://pokeapi.co/).

## Funcionalidades

- **Busca por nome**: Digite o nome de qualquer Pokémon para ver seus detalhes
- **Lista completa**: Explore os mais de 100.000 Pokémon disponíveis
- **Detalhes completos**: Altura, peso, experiência base, tipos, habilidades e status
- **Design inspirado na Pokédex**: Interface temática com cores clássicas do universo Pokémon

## Tecnologias

- **React Native** com Expo
- **TypeScript**
- **PokeAPI** para dados dos Pokémon
- **React Native Animated API** para animações

## Screenshots

O aplicativo exibe:
- Header temático estilo Pokédex
- Campo de busca com validação
- Cartão detalhado do Pokémon com imagem, tipos e estatísticas
- Lista visual com cards dos Pokémon

## Como executar

```bash
# Instalar dependências
npm install

# Iniciar o projeto
npx expo start

# Executar no Android
npx expo start --android

# Executar no iOS
npx expo start --ios

# Executar no navegador
npx expo start --web
```

## Estrutura do Projeto

```
app-apipokemon/
├── App.tsx          # Aplicativo principal
├── index.ts         # Entry point
├── assets/          # Imagens e ícones
├── package.json     # Dependências
├── tsconfig.json    # Configuração TypeScript
└── app.json         # Configuração Expo
```

## API utilizada

Este projeto utiliza a [PokeAPI](https://pokeapi.co/), uma API pública e gratuita que fornece dados sobre Pokémon.