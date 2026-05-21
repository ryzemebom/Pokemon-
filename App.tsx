import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';

const { width } = Dimensions.get('window');

// ── Type colour map ──────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  fire: '#FF6930',
  water: '#3B7BFF',
  grass: '#5DBF4A',
  electric: '#FBD100',
  psychic: '#FF5B8B',
  ice: '#5BCBD8',
  dragon: '#8958FF',
  dark: '#5F4F45',
  fairy: '#FF9AB8',
  fighting: '#C42B37',
  poison: '#AA58B0',
  ground: '#D9B764',
  rock: '#B8A835',
  bug: '#AAB83B',
  ghost: '#705798',
  steel: '#A8B8C8',
  normal: '#A8A070',
  flying: '#9F7FFF',
};

// Pokedex brand colors
const POKEMON_RED = '#E3350B';
const POKEMON_YELLOW = '#FFCB05';

type Pokemon = { name: string; image: string };
type PokemonListItem = { name: string; url: string };
type PokemonDetails = {
  id: number;
  name: string;
  image: string;
  height: number;
  weight: number;
  baseExperience: number;
  types: string[];
  abilities: string[];
  stats: { name: string; value: number }[];
};

// ── Animated stat bar ────────────────────────────────────────────
function StatBar({ name, value }: { name: string; value: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: value / 255,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const fillColor = value >= 80 ? '#4CAF50' : value >= 50 ? '#FFD600' : '#FF5A1F';

  return (
    <View style={styles.statRow}>
      <Text style={styles.statName}>{name.replace('special-', 'sp.')}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statTrack}>
        <Animated.View
          style={[
            styles.statFill,
            {
              backgroundColor: fillColor,
              width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
    </View>
  );
}

// ── Type badge ───────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  return (
    <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[type] ?? '#888' }]}>
      <Text style={styles.typeBadgeText}>{type.toUpperCase()}</Text>
    </View>
  );
}

// ── Pokémon list card ────────────────────────────────────────────
function ListCard({ item, onPress }: { item: Pokemon; onPress: (name: string) => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => onPress(item.name)}
    >
      <Animated.View style={[styles.listCard, { transform: [{ scale }] }]}>
        <Image source={{ uri: item.image }} style={styles.listCardImage} />
        <Text style={styles.listCardName}>{item.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedPokemon, setSearchedPokemon] = useState<PokemonDetails | null>(null);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const cardAnim = useRef(new Animated.Value(0)).current;
  const imageRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function fetchPokemons() {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100000');
      const data: { results: PokemonListItem[] } = await response.json();
      const list = data.results.map((item) => {
        const id = item.url.split('/').filter(Boolean).pop();
        return {
          name: item.name,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        };
      });
      setPokemons(list);
    }
    fetchPokemons();
  }, []);

  // Animate card in when a Pokémon is found
  useEffect(() => {
    if (searchedPokemon) {
      cardAnim.setValue(0);
      Animated.spring(cardAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();

      // Spin the image once
      imageRotate.setValue(0);
      Animated.timing(imageRotate, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [searchedPokemon]);

  async function handleSearch() {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      setSearchError('Digite o nome do pokémon.');
      setSearchedPokemon(null);
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    setSearchedPokemon(null);

    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error('not found');
      const data = await response.json();

      const details: PokemonDetails = {
        id: data.id,
        name: data.name,
        image:
          data.sprites?.other?.['official-artwork']?.front_default ||
          data.sprites?.front_default ||
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
        height: data.height,
        weight: data.weight,
        baseExperience: data.base_experience,
        types: data.types.map((i: any) => i.type.name),
        abilities: data.abilities.map((i: any) => i.ability.name),
        stats: data.stats.map((i: any) => ({ name: i.stat.name, value: i.base_stat })),
      };
      setSearchedPokemon(details);
    } catch {
      setSearchError('Pokémon não encontrado. Verifique o nome e tente novamente.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSearchByName(name: string) {
    setSearchLoading(true);
    setSearchError('');
    setSearchedPokemon(null);

    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name.toLowerCase())}`
      );
      if (!response.ok) throw new Error('not found');
      const data = await response.json();

      const details: PokemonDetails = {
        id: data.id,
        name: data.name,
        image:
          data.sprites?.other?.['official-artwork']?.front_default ||
          data.sprites?.front_default ||
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
        height: data.height,
        weight: data.weight,
        baseExperience: data.base_experience,
        types: data.types.map((i: any) => i.type.name),
        abilities: data.abilities.map((i: any) => i.ability.name),
        stats: data.stats.map((i: any) => ({ name: i.stat.name, value: i.base_stat })),
      };
      setSearchedPokemon(details);
    } catch {
      setSearchError('Pokémon não encontrado. Verifique o nome e tente novamente.');
    } finally {
      setSearchLoading(false);
    }
  }

  const primaryType = searchedPokemon?.types?.[0] ?? 'normal';
  const accentColor = TYPE_COLORS[primaryType] ?? '#FFD600';

  const spinDeg = imageRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={[styles.headerLens, { backgroundColor: POKEMON_RED }]} />
        <Text style={[styles.headerTitle, { color: POKEMON_YELLOW }]}>POKÉDEX</Text>
        <View style={styles.headerLights}>
          <View style={[styles.headerLight, { backgroundColor: '#FF5252' }]} />
          <View style={[styles.headerLight, { backgroundColor: POKEMON_YELLOW }]} />
          <View style={[styles.headerLight, { backgroundColor: '#4CAF50' }]} />
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { borderColor: POKEMON_RED + '60' }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              setSearchError('');
            }}
            onSubmitEditing={handleSearch}
            placeholder="digite para buscar..."
            placeholderTextColor="#555"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchTerm('');
                setSearchError('');
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: POKEMON_RED }]}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <Text style={styles.searchButtonText}>BUSCAR</Text>
        </TouchableOpacity>
      </View>

      {searchLoading && (
        <View style={styles.centerRow}>
          <ActivityIndicator size="small" color="#FFD600" />
          <Text style={styles.loadingText}> Capturando...</Text>
        </View>
      )}
      {!!searchError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {searchError}</Text>
        </View>
      )}

      {searchedPokemon && (
        <Animated.View
          style={[
            styles.card,
            {
              borderColor: accentColor + '40',
              opacity: cardAnim,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <View style={[styles.glowBlob, { backgroundColor: accentColor }]} />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSearchedPokemon(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: accentColor }]}>← Voltar</Text>
          </TouchableOpacity>

          <View style={styles.cardTop}>
            <View style={styles.cardMeta}>
              <Text style={[styles.pokemonId, { color: accentColor }]}>
                #{String(searchedPokemon.id).padStart(3, '0')}
              </Text>
              <Text style={styles.pokemonName}>{searchedPokemon.name}</Text>
              <View style={styles.typeRow}>
                {searchedPokemon.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Altura</Text>
                  <Text style={styles.infoVal}>{(searchedPokemon.height / 10).toFixed(1)} m</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Peso</Text>
                  <Text style={styles.infoVal}>{(searchedPokemon.weight / 10).toFixed(1)} kg</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Exp</Text>
                  <Text style={styles.infoVal}>{searchedPokemon.baseExperience}</Text>
                </View>
              </View>
            </View>

            <Animated.Image
              source={{ uri: searchedPokemon.image }}
              style={[styles.pokemonImage, { transform: [{ rotate: spinDeg }] }]}
            />
          </View>

          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: accentColor }]}>HABILIDADES</Text>
            <View style={styles.abilitiesRow}>
              {searchedPokemon.abilities.map((a) => (
                <View key={a} style={[styles.abilityChip, { borderColor: accentColor + '40' }]}>
                  <Text style={[styles.abilityText, { color: '#888' }]}>{a}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#1a1a1a', marginHorizontal: 20 }} />

          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: accentColor }]}>STATUS</Text>
            {searchedPokemon.stats.map((s) => (
              <StatBar key={s.name} name={s.name} value={s.value} />
            ))}
          </View>
        </Animated.View>
      )}

      {!searchedPokemon && pokemons.length > 0 && (
        <>
          {searchTerm.length >= 2 ? (
            <View style={styles.filterInfo}>
              <Text style={styles.filterText}>
                Mostrando resultados para "{searchTerm}"
              </Text>
            </View>
          ) : null}
          <FlatList
            data={
              searchTerm.length >= 2
                ? pokemons.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                : pokemons
            }
            keyExtractor={(item) => item.name}
            numColumns={3}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <ListCard item={item} onPress={(name) => {
              setSearchTerm(name);
              handleSearchByName(name);
            }} />}
          />
        </>
      )}
    </View>
  );
}

const CARD_RADIUS = 24;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },

  // Header - Minimalista e elegante
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLens: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E3350B',
    shadowColor: '#E3350B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 6,
  },
  headerLights: { flexDirection: 'row', gap: 8 },
  headerLight: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },

  // Search - Moderna com efeito glass
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0a0a0a',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#252525',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 18, marginRight: 10 },
  clearButton: { padding: 6 },
  clearText: { color: '#555', fontSize: 16 },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  searchButton: {
    borderRadius: 16,
    backgroundColor: '#E3350B',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: 24,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 2,
  },

  // Feedback
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  loadingText: {
    color: '#E3350B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  errorBox: {
    backgroundColor: 'rgba(227, 53, 11, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(227, 53, 11, 0.3)',
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Result card - Layout revolucionário
  card: {
    backgroundColor: '#111111',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  glowBlob: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '700',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 0,
  },
  cardMeta: { flex: 1, marginRight: 16 },
  pokemonId: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
    opacity: 0.7,
  },
  pokemonName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  typeBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    padding: 12,
  },
  infoCell: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    color: '#555',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoVal: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  pokemonImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },

  // Sections
  sectionBlock: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 12,
    opacity: 0.5,
  },
  abilitiesRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  abilityChip: {
    backgroundColor: '#151515',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#252525',
  },
  abilityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#888',
  },

  // Stat bars
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#0d0d0d',
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 12,
  },
  statName: {
    width: 56,
    color: '#555',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    width: 32,
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    marginRight: 10,
  },
  statTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  statFill: { height: '100%', borderRadius: 2 },

  // Grid list - Cards verticais minimalistas
  listHeading: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  filterInfo: {
    backgroundColor: 'rgba(227, 53, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(227, 53, 11, 0.2)',
  },
  filterText: {
    color: '#E3350B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  gridContent: {
    paddingHorizontal: 8,
    paddingBottom: 40,
    paddingTop: 8,
  },
  listCard: {
    width: (width - 48) / 3,
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  listCardImage: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  listCardName: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
});