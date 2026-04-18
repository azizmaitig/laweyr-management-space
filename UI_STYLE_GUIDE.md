# ONAT UI Theme & Style Guide

## Design Tokens

### Colors

#### Primary Palette
| Token | Value | Usage |
|---|---|---|
| `--clr-primary` | `#ea3f48` | Primary actions, links, active states |
| `--clr-primary-hover` | `#d6323b` | Primary button hover |
| `--clr-primary-light` | `#fef2f2` | Primary backgrounds, badges |
| `--clr-primary-dark` | `#b91c24` | Primary active state |

#### Secondary Palette
| Token | Value | Usage |
|---|---|---|
| `--clr-secondary` | `#1a1d23` | Headings, primary text |
| `--clr-secondary-light` | `#f4f5f7` | Page backgrounds, subtle backgrounds |
| `--clr-secondary-dark` | `#111318` | Dark text on light backgrounds |

#### Accent Colors
| Token | Value | Usage |
|---|---|---|
| `--clr-accent-blue` | `#3b82f6` | Info, links, case type |
| `--clr-accent-blue-light` | `#eff6ff` | Info backgrounds |
| `--clr-accent-amber` | `#f59e0b` | Warnings, medium priority |
| `--clr-accent-amber-light` | `#fef3c7` | Warning backgrounds |
| `--clr-accent-green` | `#16a34a` | Success, completed states |
| `--clr-accent-green-light` | `#f0fdf4` | Success backgrounds |
| `--clr-accent-purple` | `#8b5cf6` | Notes, special items |
| `--clr-accent-purple-light` | `#f5f3ff` | Note backgrounds |

#### Semantic Colors
| Token | Value | Usage |
|---|---|---|
| `--clr-success` | `#16a34a` | Success messages, completed tasks |
| `--clr-warning` | `#f59e0b` | Warning messages, in-progress tasks |
| `--clr-error` | `#ea3f48` | Error messages, urgent items |
| `--clr-info` | `#3b82f6` | Info messages, links |

#### Neutral Colors
| Token | Value | Usage |
|---|---|---|
| `--clr-white` | `#ffffff` | Card backgrounds, modal backgrounds |
| `--clr-border` | `#e8eaed` | Borders, dividers |
| `--clr-border-light` | `#f0f1f3` | Subtle borders |
| `--clr-text-muted` | `#9ca3af` | Secondary text, dates, metadata |
| `--clr-text-secondary` | `#6b7280` | Tertiary text, descriptions |

### Typography

#### Font Family
```scss
--font-family-latin: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-family-arabic: 'Cairo', 'Noto Sans Arabic', sans-serif;
--font-family: var(--font-family-latin); // default (overridden for Arabic/RTL)
```

#### Font Sizes
| Token | Value | Usage |
|---|---|---|
| `--text-xs` | `0.625rem` (10px) / `0.6875rem` (11px for Arabic/RTL) | Tiny labels, version badges (avoid for Arabic text; OK for Latin numerals/symbols) |
| `--text-sm` | `0.6875rem` (11px) | Metadata, dates, secondary info |
| `--text-base` | `0.75rem` (12px) | Body text, list items |
| `--text-md` | `0.8125rem` (13px) | Card titles, form labels |
| `--text-lg` | `0.875rem` (14px) | Section titles, input text |
| `--text-xl` | `1rem` (16px) | Page titles, modal titles |
| `--text-2xl` | `1.125rem` (18px) | Hero titles |
| `--text-3xl` | `1.25rem` (20px) | Dashboard stats |

#### Font Weights
| Token | Value | Usage |
|---|---|---|
| `--font-normal` | `400` | Body text |
| `--font-medium` | `500` | Subtle emphasis |
| `--font-semibold` | `600` | Card titles, labels |
| `--font-bold` | `700` | Headings, primary actions |

#### Line Heights
| Token | Value | Usage |
|---|---|---|
| `--leading-tight` | `1.2` | Headings |
| `--leading-normal` | `1.5` | Body text |
| `--leading-relaxed` | `1.7` | Notes content, rich text |

### Spacing

#### Spacing Scale
| Token | Value | Usage |
|---|---|---|
| `--space-1` | `0.125rem` (2px) | Icon gaps, tight spacing |
| `--space-2` | `0.25rem` (4px) | Small gaps between related items |
| `--space-3` | `0.375rem` (6px) | Button padding, small gaps |
| `--space-4` | `0.5rem` (8px) | Standard gap, form field spacing |
| `--space-5` | `0.625rem` (10px) | Card padding (compact) |
| `--space-6` | `0.75rem` (12px) | Card padding, section gaps |
| `--space-8` | `1rem` (16px) | Standard padding, modal padding |
| `--space-10` | `1.25rem` (20px) | Section spacing |
| `--space-12` | `1.5rem` (24px) | Page margins, large gaps |
| `--space-16` | `2rem` (32px) | Page padding |
| `--space-20` | `2.5rem` (40px) | Hero spacing |

### Border Radius
| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Buttons, badges, small items |
| `--radius-md` | `8px` | Form inputs, small cards |
| `--radius-lg` | `10px` | Standard cards, modals |
| `--radius-xl` | `12px` | Large cards, panels |
| `--radius-2xl` | `16px` | Hero cards, main containers |
| `--radius-full` | `9999px` | Pills, avatars, circular items |

### Shadows
| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.04)` | Subtle elevation, cards |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,.06)` | Hover states, dropdowns |
| `--shadow-lg` | `0 4px 16px rgba(0,0,0,.08)` | Modals, popovers |
| `--shadow-xl` | `0 8px 32px rgba(0,0,0,.12)` | Full-screen overlays |

### Transitions
| Token | Value | Usage |
|---|---|---|
| `--transition-fast` | `150ms ease` | Hover states, color changes |
| `--transition` | `200ms ease` | Standard transitions, shadows |
| `--transition-slow` | `300ms ease` | Large movements, modals |

---

## Component Styles

### Buttons

#### Primary Button
```scss
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--clr-primary);
  color: white;
  font-family: var(--font-family-arabic);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition);

  &:hover {
    background: var(--clr-primary-hover);
    box-shadow: var(--shadow-sm);
  }

  &:active {
    background: var(--clr-primary-dark);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 14px;
    height: 14px;
  }
}
```

#### Secondary Button
```scss
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border: 1.5px solid var(--clr-border);
  border-radius: var(--radius-sm);
  background: white;
  color: var(--clr-text-secondary);
  font-family: var(--font-family-arabic);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition);

  &:hover {
    border-color: var(--clr-secondary);
    color: var(--clr-secondary);
    background: var(--clr-secondary-light);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

#### Icon Button
```scss
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--clr-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--clr-secondary-light);
    color: var(--clr-secondary);
  }

  &--danger:hover {
    background: var(--clr-primary-light);
    color: var(--clr-error);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}
```

#### Button Sizes
```scss
.btn--sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}

.btn--lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-lg);
}
```

### Cards

#### Standard Card
```scss
.card {
  background: white;
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: all var(--transition);

  &:hover {
    box-shadow: var(--shadow-md);
  }
}
```

#### Compact Card
```scss
.card--compact {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}
```

#### Interactive Card
```scss
.card--interactive {
  cursor: pointer;

  &:hover {
    border-color: var(--clr-primary);
    box-shadow: var(--shadow-md);
  }
}
```

### Form Elements

#### Input
```scss
.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--clr-border);
  border-radius: var(--radius-md);
  font-family: var(--font-family-arabic);
  font-size: var(--text-lg);
  color: var(--clr-secondary);
  background: var(--clr-secondary-light);
  outline: none;
  transition: all var(--transition-fast);

  &:focus {
    border-color: var(--clr-primary);
    background: white;
  }

  &::placeholder {
    color: var(--clr-text-muted);
  }
}
```

#### Select
```scss
.form-select {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--clr-border);
  border-radius: var(--radius-md);
  font-family: var(--font-family-arabic);
  font-size: var(--text-base);
  color: var(--clr-secondary);
  background: white;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: var(--clr-primary);
  }
}
```

#### Label
```scss
.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--clr-text-muted);
  margin-bottom: var(--space-1);
}
```

### Badges

#### Status Badge
```scss
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  white-space: nowrap;

  &--success {
    background: var(--clr-accent-green-light);
    color: var(--clr-accent-green);
  }

  &--warning {
    background: var(--clr-accent-amber-light);
    color: var(--clr-accent-amber);
  }

  &--error {
    background: var(--clr-primary-light);
    color: var(--clr-error);
  }

  &--info {
    background: var(--clr-accent-blue-light);
    color: var(--clr-accent-blue);
  }

  &--neutral {
    background: var(--clr-secondary-light);
    color: var(--clr-text-muted);
  }
}
```

### Empty States

```scss
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-8);
  color: var(--clr-text-muted);
  text-align: center;

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: var(--space-4);
    opacity: 0.35;
  }

  p {
    font-size: var(--text-md);
    margin: 0 0 var(--space-4);
  }
}
```

### Lists

#### List Item
```scss
.list-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-lg);
  background: white;
  transition: all var(--transition);

  &:hover {
    box-shadow: var(--shadow-sm);
  }

  &__icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: var(--text-md);
    font-weight: var(--font-semibold);
    color: var(--clr-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__subtitle {
    font-size: var(--text-sm);
    color: var(--clr-text-muted);
    margin-top: var(--space-1);
  }

  &__actions {
    display: flex;
    gap: var(--space-1);
    flex-shrink: 0;
  }
}
```

### Loading States

#### Spinner
```scss
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--clr-border);
  border-top-color: var(--clr-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### Skeleton
```scss
.skeleton {
  background: linear-gradient(90deg, var(--clr-secondary-light) 25%, #e8eaed 50%, var(--clr-secondary-light) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);

  &--text {
    height: 12px;
    margin-bottom: var(--space-2);
  }

  &--title {
    height: 18px;
    margin-bottom: var(--space-3);
  }

  &--avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Layout Patterns

### Page Layout
```scss
.page {
  padding: var(--space-16);
  max-width: 1200px;
  margin: 0 auto;
}

.page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);
}

.page__title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--clr-secondary);
  margin: 0;
}
```

### Grid Layouts
```scss
.grid {
  display: grid;
  gap: var(--space-6);

  &--2col {
    grid-template-columns: repeat(2, 1fr);
  }

  &--3col {
    grid-template-columns: repeat(3, 1fr);
  }

  &--4col {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 768px) {
    &--2col, &--3col, &--4col {
      grid-template-columns: 1fr;
    }
  }
}
```

### Flex Layouts
```scss
.flex {
  display: flex;

  &--center {
    align-items: center;
    justify-content: center;
  }

  &--between {
    justify-content: space-between;
  }

  &--wrap {
    flex-wrap: wrap;
  }

  &--col {
    flex-direction: column;
  }

  &--gap-2 { gap: var(--space-2); }
  &--gap-3 { gap: var(--space-3); }
  &--gap-4 { gap: var(--space-4); }
  &--gap-6 { gap: var(--space-6); }
}
```

---

## Feature-Specific Styles

### Task Styles
```scss
.task-item {
  &__checkbox {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
    border: 2px solid var(--clr-border);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);

    &--DONE {
      border-color: var(--clr-accent-green);
      background: var(--clr-accent-green);
      color: white;
    }

    &--IN_PROGRESS {
      border-color: var(--clr-accent-amber);
    }
  }

  &__priority {
    &--HIGH { background: var(--clr-primary-light); color: var(--clr-error); }
    &--MEDIUM { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    &--LOW { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
  }
}
```

### Document Styles
```scss
.doc-item {
  &__icon {
    &--contract { background: var(--clr-accent-blue-light); color: var(--clr-accent-blue); }
    &--evidence { background: var(--clr-accent-amber-light); color: var(--clr-accent-amber); }
    &--judgment { background: var(--clr-accent-green-light); color: var(--clr-accent-green); }
    &--correspondence { background: var(--clr-accent-purple-light); color: var(--clr-accent-purple); }
  }
}
```

### Note Styles
```scss
.note-card {
  &__content {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--clr-text-secondary);

    :first-child { margin-top: 0; }
    :last-child { margin-bottom: 0; }

    ul { padding-right: var(--space-6); margin: var(--space-1) 0; }
  }
}
```

### Timeline Styles
```scss
.timeline {
  &__event {
    padding: var(--space-4) var(--space-6);
    border-right: 2px solid var(--clr-border);
    position: relative;

    &::before {
      content: '';
      position: absolute;
      right: -6px;
      top: var(--space-6);
      width: 10px;
      height: 10px;
      border-radius: var(--radius-full);
      background: var(--clr-primary);
      border: 2px solid white;
    }
  }
}
```

### Search Styles
```scss
.search-result-item {
  &__icon { font-size: 1.25rem; }
  &__type {
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    background: var(--clr-secondary-light);
    color: var(--clr-text-muted);
  }
}
```

---

## Usage Guidelines

### DO
- Use CSS custom properties for all colors, spacing, and typography
- Use the spacing scale consistently (`--space-*`)
- Use semantic color tokens (`--clr-error`, `--clr-success`) instead of raw values
- Keep components RTL-friendly (use `margin-inline-start` instead of `margin-left`)
- Use `var(--font-family-arabic)` for all text content

### DON'T
- Hardcode color values in components
- Use arbitrary spacing values (stick to the scale)
- Mix different border radius values
- Use `!important` unless absolutely necessary
- Forget to handle RTL layout
