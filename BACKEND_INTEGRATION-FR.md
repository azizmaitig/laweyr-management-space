# Architecture d'Intégration Backend

Ce document définit les modèles architecturaux, les couches et les standards pour l'intégration du frontend Angular avec le backend Spring Boot.

## 1. Couches Architecturales

L'intégration est structurée en quatre couches distinctes pour assurer la séparation des préoccupations et la maintenabilité.

### Couche 1 : Infrastructure (Intercepteurs & Config)
- **Rôle :** Gère les préoccupations transversales pour chaque requête HTTP.
- **Composants :**
  - `AuthInterceptor` : Attache les jetons JWT depuis `AuthStateService`.
  - `ErrorInterceptor` : Capture les erreurs HTTP globales, gère les 401 (déconnexion) et émet des événements.
  - `LoadingInterceptor` : Suit les requêtes actives pour afficher/masquer les indicateurs de chargement globaux.
  - `EnvironmentConfig` : Géré via `src/environments/`, fournissant l'`apiUrl`.

### Couche 2 : Services API (Accès aux Données)
- **Rôle :** Services atomiques et sans état qui correspondent directement aux ressources REST.
- **Modèle :** `*ApiService` (ex: `CasesApiService`).
- **Responsabilités :**
  - Construction des chemins d'URL en utilisant les constantes `ApiEndpoints`.
  - Mapping des réponses HTTP vers les DTOs/Modèles.
  - Gestion des paramètres de pagination.
  - Mapping d'erreurs simple (si spécifique au point de terminaison).

### Couche 3 : Gestion d'État (Logique Métier)
- **Rôle :** Gère le cache de données local et coordonne les effets secondaires.
- **Modèle :** `*StateService` (ex: `CasesStateService`).
- **Responsabilités :**
  - Appel des services API.
  - Gestion des `BehaviorSubject` pour les flux de données réactifs.
  - Émission d'événements globaux via `EventService` après des mutations réussies.
  - Mise en œuvre de mises à jour optimistes (le cas échéant).

### Couche 4 : Temps Réel (Synchronisation)
- **Rôle :** Gère les mises à jour asynchrones du serveur.
- **Composants :**
  - `RealtimeService` : Gère les connexions WebSocket/STOMP.
  - Mappe les types d'événements backend (ex: `case.updated`) vers les `AppEventType` du frontend.

---

## 2. Architecture de Sécurité

### Flux d'Authentification (JWT)
1. **Connexion :** `AuthApiService.login()` reçoit un JWT et un profil utilisateur.
2. **Persistance :** `AuthStateService` stocke le jeton dans le `localStorage` et dans un état mémoire privé.
3. **Transmission :** `AuthInterceptor` injecte automatiquement l'en-tête `Authorization: Bearer <token>` dans toutes les requêtes sortantes, sauf pour les routes publiques.
4. **Expiration :** `ErrorInterceptor` détecte les réponses `401 Unauthorized` et déclenche `AuthStateService.logout()`.

### Autorisation
- **Gardes de Route :** `AuthGuard` protège les routes privées ; `PermissionGuard` vérifie les rôles/permissions spécifiques de l'utilisateur.
- **Directives :** La directive `*hasPermission` restitue conditionnellement les éléments de l'interface utilisateur en fonction des rôles.

---

## 3. Modèles de Communication

### Standards de l'API RESTful
- **Format Standard :** Toutes les réponses devraient idéalement suivre l'enveloppe `ApiResponse<T>` :
  ```json
  {
    "success": boolean,
    "data": T,
    "message": string,
    "errors": []
  }
  ```
- **Pagination :** Utilise les paramètres de requête `page` et `size`. Les réponses incluent des métadonnées (`totalElements`, `totalPages`, etc.).
- **Méthodes HTTP :** 
  - `GET` : Récupérer des données.
  - `POST` : Créer de nouvelles ressources.
  - `PUT` : Mise à jour complète.
  - `PATCH` : Mise à jour partielle.
  - `DELETE` : Supprimer une ressource.

### Intégration Basée sur les Événements
Lorsque le backend termine une opération (via REST ou WebSocket), le frontend propage ce changement via le `EventService`. Cela permet aux fonctionnalités découplées (comme le Journal ou les Notifications) de réagir sans dépendances directes entre services.

---

## 4. Stratégie de Modélisation des Données

- **DTOs (Data Transfer Objects) :** Définis comme des interfaces TypeScript dans `core/models/` ou dans des dossiers spécifiques aux fonctionnalités. Ils correspondent à la structure JSON du backend.
- **Enums :** Les enums partagés (ex: `CaseStatus`, `TaskPriority`) sont utilisés pour maintenir la sécurité de typage à travers la frontière d'intégration.
- **Mapping :** Le mapping simple est effectué dans le `ApiService` ; la transformation d'objets métier complexes se fait dans le `StateService`.

---

## 5. Gestion des Erreurs & Résilience

### Stratégie Globale
1. **Niveau Intercepteur :** Log de l'erreur dans la console, déclenchement de "Jeton Expiré" si 401.
2. **Niveau État :** Capture de l'erreur, mise à jour de l'état local `error` (BehaviorSubject) et émission d'un événement d'erreur pour les snackbars de l'interface utilisateur.
3. **Niveau Composant :** Écoute du flux `error$` depuis le service d'état pour afficher des messages d'erreur contextuels.

### Logique de Réessai
Les requêtes GET critiques utilisent RxJS `retry(n)` pour gérer les problèmes de réseau transitoires avant d'échouer.

---

## 6. Gestion des Contrats

Pour éviter les dérives entre le frontend et le backend :
- **Points de Terminaison API :** Centralisés dans `src/app/core/constants/api-endpoints.ts`.
- **OpenAPI :** La documentation est maintenue dans `docs/openapi/`. 
- **Mocking :** `HearingsDemoInterceptor` et `LawyerSubAccountsDemoInterceptor` fournissent un schéma pour les formes de données attendues avant que le backend ne soit complètement implémenté.

---

## 7. Cycle de Vie de l'Environnement

| Environnement | URL de Base API | Comportement |
|---|---|---|
| **Développement** | `http://localhost:8080/api` | Logs complets, intercepteurs actifs. |
| **Staging** | `https://staging-api.onat.tn/api` | Minified, intercepteurs de type production. |
| **Production** | `/api` | Chemin relatif (déploiement sur la même origine). |
