# Amirhossein Mohammadpour — Portfolio

Cinematic personal portfolio built with vanilla HTML, CSS and JavaScript.

## Structure
- `index.html` — cinematic portfolio page
- `styles.css` — responsive premium visual system
- `script.js` — scroll scenes, parallax, 3D pointer interactions and motion
- `favicon.svg` — portfolio favicon
- `404.html` — GitHub Pages fallback
- `.nojekyll` — ensures the site is served as a static site
- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment
- `.github/workflows/validate.yml` — static validation and smoke test

## GitHub Pages

The site is prepared for GitHub Pages using the official Actions deployment flow.

In GitHub, open:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

After Pages is enabled with **GitHub Actions** as the source, pushes to `main` deploy the portfolio automatically.

Project site URL:

`https://amirho33ein7.github.io/Website-/`

## Portfolio scope

The portfolio is built from the user's real GitHub repositories inspected during development.

Included projects:
- `ghandchand`
- `ario-game`
- `amirbot`
- `food-delivery-python`
- `benzine-fuel-level-checker`

The `amirvpn` repository is intentionally excluded.

## Verification

The validation workflow checks required files, required profile links, the absence of the excluded VPN repository URL, and a local static-site smoke test.

No project data is invented in the portfolio.
