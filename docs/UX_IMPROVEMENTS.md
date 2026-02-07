# Améliorations UX MXTune

Ce document décrit les nouveaux composants créés pour améliorer l'expérience utilisateur de MXTune, basés sur le feedback de ChatGPT.

## 1. Chat IA - Cards Structurées

Les nouveaux composants de cards permettent de transformer le chat en "assistant guidé" avec des blocs visuels clairs.

### Composants disponibles

```tsx
import {
  DiagnosticCard,
  HypothesisCard,
  ActionCard,
  ExpectedResultCard,
  SessionSummaryCard,
  TipCard,
} from "@/components/chat";
```

#### DiagnosticCard
Affiche un problème identifié avec un niveau de sévérité.
```tsx
<DiagnosticCard 
  symptom="Chocs secs sur petits freinages"
  severity="medium" // "low" | "medium" | "high"
/>
```

#### HypothesisCard
Affiche une cause probable avec un niveau de confiance.
```tsx
<HypothesisCard 
  cause="Compression trop fermée"
  explanation="La fourche résiste trop aux petits mouvements"
  confidence="high" // "low" | "medium" | "high"
/>
```

#### ActionCard
Propose une action à effectuer avec boutons interactifs.
```tsx
<ActionCard 
  action="Ouvrir la compression fourche"
  setting="Compression avant"
  direction="increase" // "increase" | "decrease" | "neutral"
  clicks={2}
  unit="clics"
  impact="Plus de confort sur petits chocs"
  onApply={() => handleApply()}
  onMarkTested={() => handleMarkTested()}
/>
```

#### ExpectedResultCard
Décrit ce que l'utilisateur devrait ressentir.
```tsx
<ExpectedResultCard 
  result="Meilleure absorption des petites bosses"
  feeling="La moto sera plus souple en entrée de virage"
/>
```

#### SessionSummaryCard
Résumé de fin de session partageable.
```tsx
<SessionSummaryCard 
  adjustments={[
    { setting: "Compression avant", before: 12, after: 10, unit: "clics" }
  ]}
  improvementAreas={["Confort en virage", "Stabilité au freinage"]}
  nextSteps={["Tester sur piste", "Affiner si besoin"]}
  onShare={() => handleShare()}
/>
```

## 2. Stepper de Progression Amélioré

```tsx
import { ChatStepsEnhanced, ChatTimeline } from "@/components/chat";
```

### ChatStepsEnhanced
Stepper horizontal animé avec barre de progression.
```tsx
<ChatStepsEnhanced 
  currentStep="proposition" // "collecte" | "verification" | "proposition" | "test"
  completedSteps={["collecte", "verification"]}
/>
```

### ChatTimeline
Timeline verticale pour visualiser l'historique de session.
```tsx
<ChatTimeline 
  events={[
    { id: "1", type: "step", title: "Analyse démarrée", completed: true },
    { id: "2", type: "action", title: "Compression ajustée", completed: true },
    { id: "3", type: "validation", title: "Test terrain", completed: false }
  ]}
/>
```

## 3. Clicker Amélioré avec Feedback Visuel

```tsx
import { EnhancedClicker } from "@/components/clickers";
```

### Features
- **Feedback haptique** (vibration sur mobile)
- **Code couleur dynamique** selon la zone de réglage
- **Micro-copy orienté ressenti** (ex: "+2 clics = plus de confort")
- **Indicateur visuel de la recommandation**
- **Animation sur les ajustements**

```tsx
<EnhancedClicker
  label="Compression"
  sublabel="Résistance à l'enfoncement"
  value={12}
  maxValue={24}
  recommendedValue={10}
  originalValue={14}
  onChange={(value) => setValue(value)}
  unit="clics"
  type="compression" // "compression" | "rebound" | "sag" | "pressure"
  tip="Plus fermé = plus ferme sur les chocs"
  showFeelingHints={true}
  size="md" // "sm" | "md" | "lg"
/>
```

## 4. État Actif Moto/Kit/Config

```tsx
import { ActiveMotoStatus, RidingSignature } from "@/components/moto/active-moto-status";
```

### ActiveMotoStatus
Affiche clairement quelle moto, kit et config sont actifs avec une "vue santé".
```tsx
<ActiveMotoStatus
  moto={{
    id: "1",
    brand: "KTM",
    model: "350 EXC-F",
    year: 2024
  }}
  kit={{
    id: "1",
    brand: "WP",
    model: "XACT Pro"
  }}
  activeConfig={{
    id: "1",
    name: "Config Sable",
    terrainType: "sable"
  }}
  health={{
    sagOk: true,
    sagValue: 32,
    tirePressureOk: true,
    tirePressureFront: 0.8,
    tirePressureRear: 0.9,
    lastConfigDate: new Date(),
    lastConfigName: "Config Sable",
    readyToRide: true
  }}
/>
```

### RidingSignature
Affiche la "signature de pilotage" sur le profil.
```tsx
<RidingSignature
  level="Intermédiaire"
  style="Agressif"
  terrain="Sable"
  objective="Performance"
  weight={85}
/>
```

## 5. Preuves Sociales pour la Communauté

```tsx
import { 
  SocialProofBadges,
  CommunityConfigHighlight,
  TrendingConfigsSection,
  RecommendedForYou
} from "@/components/community/social-proof";
```

### SocialProofBadges
Badges de confiance pour les configs.
```tsx
<SocialProofBadges
  likes={25}
  saves={12}
  tests={47}
  validatedSessions={5}
  isTopConfig={true}
  isTrending={false}
  matchScore={85}
/>
```

### TrendingConfigsSection
Section "Configs tendances du mois".
```tsx
<TrendingConfigsSection
  configs={[...]}
  onConfigClick={(id) => handleClick(id)}
/>
```

### RecommendedForYou
Section "Recommandé pour toi" basée sur le profil.
```tsx
<RecommendedForYou
  configs={[
    {
      id: "1",
      name: "Config Sable Expert",
      matchScore: 92,
      reason: "Parfait pour ton profil 85kg + sable",
      terrain: "sable"
    }
  ]}
/>
```

## 6. Empty States Pédagogiques

```tsx
import {
  EmptyState,
  EmptyMotoState,
  EmptyConfigState,
  EmptySavedConfigsState,
  EmptyCommunityState,
  EmptyChatState,
  SkeletonCard,
  PageLoading,
  SuccessToast
} from "@/components/ui/empty-states";
```

### Exemples
```tsx
// Empty state générique
<EmptyState
  variant="chat"
  icon={<MessageSquare />}
  title="Prêt à commencer"
  description="Lance ta première session IA"
  actionLabel="Commencer"
  onAction={() => {}}
  tips={["L'IA s'adapte à ton niveau", "Sauvegarde automatique"]}
/>

// Empty states prédéfinis
<EmptyMotoState onAddMoto={() => {}} />
<EmptyConfigState onStartChat={() => {}} onBrowseCommunity={() => {}} />
<EmptyChatState onSelectMoto={() => {}} />

// Skeleton loaders
<SkeletonCard variant="config" />
<SkeletonCard variant="moto" />
<SkeletonCard variant="chat" />

// Page loading
<PageLoading title="Chargement des configs" />
```

## 7. Animations CSS

Les animations suivantes sont disponibles dans `globals.css`:

- `.animate-bounce-up` / `.animate-bounce-down` - Feedback de clic
- `.animate-pulse-glow` - Indicateur actif
- `.animate-slide-in-top` / `.animate-slide-in-bottom` - Entrées
- `.animate-scale-in` - Apparition modale
- `.animate-shimmer` - Skeleton loader
- `.animate-spin-slow` - Loader lent
- `.glow-purple` / `.glow-emerald` / `.glow-amber` - Effets de lueur
- `.card-hover` - Effet hover sur cartes
- `.transition-smooth` - Transitions fluides

## Priorités d'intégration

1. **Chat IA** - Intégrer les cards dans `chat-message.tsx`
2. **Clickers** - Remplacer `AdjustableValue` par `EnhancedClicker`
3. **Moto Status** - Ajouter dans la sidebar ou modal moto
4. **Social Proof** - Intégrer dans la page configs/communauté
5. **Empty States** - Remplacer les états vides existants
