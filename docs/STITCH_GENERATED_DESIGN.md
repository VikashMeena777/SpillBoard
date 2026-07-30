**SpillBoard Design System**

**Overview**

SpillBoard is an anonymous Gen-Z gossip teahouse where users can share and rate tea without repercussions. This design system is based on Google Stitch's Generative UI Engine and adheres to Y2K Underground Scandal Gazette & Cyberpunk Teahouse theme.

**Typography**

### Fonts

#### Primary Header

* Font Family: `Dela Gothic One`
* Font Styles:
	+ `h1`: `2.25rem`, Bold, Dela Gothic One
	+ `h2`: `1.5rem`, Semi-Bold, Dela Gothic One
	+ `h3`: `1.125rem`, Bold, Dela Gothic One
* Font Sizes:
	+ `h1`: `2.25rem`
	+ `h2`: `1.5rem`
	+ `h3`: `1.125rem`

#### Verdicts

* Font Family: `Syne`
* Font Styles:
	+ `p`: `1rem`, Regular, Syne
	+ `span.verdict`: `1.125rem`, Regular, Syne
* Color: `#FF0055` (Cyber Crimson)
* Text Shadow: `0 0 0.125rem #000`

#### Badges

* Font Family: `Space Mono`
* Font Styles:
	+ `badge`: `0.875rem`, Regular, Space Mono
* Color: `#00FF66` (Acid Green)

#### Body

* Font Family: `Plus Jakarta Sans`
* Font Styles:
	+ `p`: `1rem`, Regular, Plus Jakarta Sans
	+ `span`: `1rem`, Regular, Plus Jakarta Sans
* Line Height: `1.5rem`

### Text Styles

* `success-text`: Text Color: `#00F0FF` (Cyan Cold)
* `attention-text`: Text Color: `#FFB800` (Amber Tea)
* `error-text`: Text Color: `#FF0055` (Cyber Crimson)

### Code Example
```css
font-family: Dela Gothic One, Helvetica, Arial, sans-serif;
h1 {
  font-family: Dela Gothic One;
  font-size: 2.25rem;
  font-weight: bold;
}

h2 {
  font-family: Dela Gothic One;
  font-size: 1.5rem;
  font-weight: 600;
}

p {
  font-family: Plus Jakarta Sans;
  font-size: 1rem;
}
```

**Color Palette**

### Primary Colors

* `deep-obsidian`: `#090714`
* `lively-lavender`: `#130e26`
* `acid-green`: `#00FF66`
* `cyber-crimson`: `#FF0055`
* `warm-amber`: `#FFB800`
* `icy-cyan`: `#00F0FF`

### Secondary Colors

* `background`: `#090714` (Deep Obsidian)
* `accent`: `#00FF66` (Acid Green)
* `text`: `#FFFFFF` (White)

### Color Examples
```css
background-color: #090714;
color: #FF0055;
border-color: #FFB800;
```

**Components**

### Live Marquee Ticker Banner

* **Props**: `text`, `size`, `speed`
* **Size**: `lg`, `md`, `sm`
* **Speed**: `normal`, `fast`, `slow`

#### Example
```jsx
<LiveMarquee text="Spill the tea!" size="lg" speed="fast" />
```
```jsx
LiveMarquee.propTypes = {
  text: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['lg', 'md', 'sm']).isRequired,
  speed: PropTypes.oneOf(['normal', 'fast', 'slow']).isRequired,
};
```

### Liquid Thermometer Edge Gauge

* **Props**: `value`, `size`, `color`
* **Size**: `lg`, `md`, `sm`
* **Color**: `deep-obsidian`, `icy-cyan`, `acid-green`

#### Example
```jsx
<LiquidThermometer value={70} size="lg" color="icy-cyan" />
```
```jsx
LiquidThermometer.propTypes = {
  value: PropTypes.number.isRequired,
  size: PropTypes.oneOf(['lg', 'md', 'sm']).isRequired,
  color: PropTypes.oneOf(['deep-obsidian', 'icy-cyan', 'acid-green']).isRequired,
};
```

### Wax Seal Badges

* **Props**: `title`, `color`, `size`

#### Example
```jsx
<WaxSeal title="VIP" color="acid-green" size="lg" />
```
```jsx
WaxSeal.propTypes = {
  title: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['deep-obsidian', 'icy-cyan', 'acid-green']).isRequired,
  size: PropTypes.oneOf(['lg', 'md', 'sm']).isRequired,
};
```

### Reaction Pills

* **Props**: `reaction`, `color`

#### Example
```jsx
<ReactionPill reaction="like" color="icy-cyan" />
```
```jsx
ReactionPill.propTypes = {
  reaction: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['deep-obsidian', 'icy-cyan', 'acid-green', 'cyber-crimson']).isRequired,
};
```

**Design Tokens**

* **Typography**:
	+ `fontSizes`: `{ lg: 2.25rem, md: 1.5rem, sm: 1rem }`
* **Color**:
	+ `palette`: `[{ name: 'deep-obsidian', value: '#090714' }, ...]`
* **Components**:
	+ `liveMarquee`: `{ size: 'lg' }`
	+ `liquidThermometer`: `{ size: 'lg' }`
	+ `waxSeal`: `{ size: 'lg' }`
	+ `reactionPill`: `{ color: 'icy-cyan' }`

**Design System Guidelines**

* Use consistent typography throughout the app.
* Use the color palette consistently across the app.
* Use components consistently across the app.
* Use design tokens consistently across the app.

**Changelog**

* 2023-02-01: Initial release.
* 2023-02-15: Added design tokens and updated component props.
* 2023-03-01: Updated typography and color palette.