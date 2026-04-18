# Documentation des Points de Terminaison API (REST)

Ce document répertorie tous les points de terminaison (endpoints) backend utilisés par l'application ONAT Angular. Les URLs sont relatives à la base de l'API (`environment.apiUrl`).

## 1. Authentification (`/auth`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Authentification de l'utilisateur et récupération du jeton JWT. |
| `POST` | `/auth/register` | Création d'un nouveau compte utilisateur. |
| `POST` | `/auth/logout` | Déconnexion et invalidation de la session (côté serveur). |
| `POST` | `/auth/refresh` | Renouvellement du jeton JWT expiré. |
| `GET` | `/auth/profile` | Récupération des informations du profil de l'utilisateur connecté. |

## 2. Dossiers / Affaires (`/cases`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/cases` | Liste tous les dossiers de l'avocat. |
| `GET` | `/cases/paginated` | Liste paginée des dossiers. |
| `GET` | `/cases/search` | Recherche multicritère de dossiers. |
| `GET` | `/cases/{id}` | Détails d'un dossier spécifique. |
| `GET` | `/cases/{id}/timeline` | Historique d'activité d'un dossier. |
| `GET` | `/cases/{id}/documents` | Liste des documents liés à un dossier. |
| `GET` | `/cases/{id}/tasks` | Liste des tâches liées à un dossier. |
| `GET` | `/cases/{id}/notes` | Liste des notes liées à un dossier. |
| `GET` | `/cases/{id}/export/pdf` | Génération d'un export PDF du dossier. |
| `GET` | `/cases/{id}/export/json` | Génération d'un export JSON du dossier. |

## 3. Clients (`/clients`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/clients` | Liste des clients. |
| `GET` | `/clients/search` | Recherche de clients. |
| `GET` | `/clients/{id}` | Détails d'un client. |
| `GET` | `/clients/{id}/cases` | Liste des dossiers associés à un client. |

## 4. Tâches (`/tasks`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks` | Liste globale des tâches. |
| `GET` | `/tasks/case/{caseId}` | Tâches liées à un dossier spécifique. |
| `GET` | `/tasks/today` | Tâches prévues pour aujourd'hui. |
| `GET` | `/tasks/{id}` | Détails d'une tâche. |
| `POST` | `/tasks` | Création d'une nouvelle tâche. |
| `PUT` | `/tasks/{id}` | Mise à jour d'une tâche. |
| `DELETE` | `/tasks/{id}` | Suppression d'une tâche. |

## 5. Documents (`/documents`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/documents/case/{caseId}` | Documents d'un dossier. |
| `GET` | `/documents/case/{caseId}/search` | Recherche de documents dans un dossier. |
| `POST` | `/documents/upload` | Téléchargement d'un nouveau document. |
| `GET` | `/documents/{id}` | Récupération/Téléchargement d'un document spécifique. |

## 6. Audiences et Séances de Tribunal (`/court-sessions`, `/hearings`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/court-sessions` | Liste des séances de tribunal. |
| `GET` | `/court-sessions/case/{caseId}` | Séances liées à un dossier. |
| `GET` | `/court-sessions/{id}` | Détails d'une séance. |
| `GET` | `/hearings/upcoming` | Liste des audiences à venir. |

## 7. Préparations et Résultats de Séance

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/session-preparations/case/{caseId}` | Préparations pour les séances d'un dossier. |
| `GET` | `/session-outcomes/case/{caseId}` | Résultats/Jugements des séances d'un dossier. |
| `GET` | `/deadlines/case/{caseId}` | Délais et échéances juridiques d'un dossier. |

## 8. Agenda et Rappels (`/agenda-items`, `/reminders`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/agenda-items` | Liste unifiée des éléments d'agenda (séances, tâches, etc.). |
| `GET` | `/agenda-items/upcoming` | Éléments d'agenda à venir. |
| `GET` | `/agenda-items/range` | Éléments d'agenda pour une période donnée. |
| `GET` | `/reminders/pending` | Rappels en attente d'envoi. |
| `POST` | `/reminders/{id}/sent` | Marquer un rappel comme envoyé. |

## 9. Finances (`/fees`, `/invoices`, `/expenses`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/fees/summary` | Résumé global des honoraires. |
| `GET` | `/invoices/case/{caseId}` | Factures liées à un dossier. |
| `GET` | `/expenses/case/{caseId}` | Débours et frais liés à un dossier. |
| `GET` | `/time-entries/case/{caseId}` | Saisies de temps pour la facturation. |

## 10. Notifications (`/notifications`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/notifications` | Liste des notifications de l'utilisateur. |
| `GET` | `/notifications/unread-count` | Nombre de notifications non lues. |
| `POST` | `/notifications/{id}/read` | Marquer une notification comme lue. |
| `POST` | `/notifications/read-all` | Marquer toutes les notifications comme lues. |

## 11. Statistiques (`/stats`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/stats/overview` | Aperçu général des indicateurs clés (KPIs). |
| `GET` | `/stats/cases-by-type` | Répartition des dossiers par type. |
| `GET` | `/stats/cases-by-status` | Répartition des dossiers par statut. |
| `GET` | `/stats/revenue` | Statistiques de revenus et paiements. |

## 12. Administration Plateforme (`/platform`)

| Méthode | Chemin | Description |
| :--- | :--- | :--- |
| `GET` | `/platform/users` | Liste des utilisateurs de la plateforme (admin). |
| `GET` | `/platform/activity-logs` | Journaux d'activité système. |
| `POST` | `/platform/backups/trigger` | Déclencher une sauvegarde manuelle. |
| `POST` | `/platform/backups/{id}/restore` | Restaurer une sauvegarde spécifique. |

---

**Note :** Pour les détails sur les structures JSON envoyées et reçues (DTOs), veuillez vous référer à la documentation OpenAPI (`docs/openapi/`) ou aux interfaces TypeScript dans `src/app/core/models/`.
