# pckp.net

Personal site for Thomas Pickup, served by GitHub Pages from the root of `main` at [pckp.net](https://pckp.net/).

It's plain HTML, CSS and a little JavaScript, with no build step.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The page |
| `404.html` | Shown by GitHub Pages for unknown URLs |
| `assets/css/style.css` | All styles; colours and fonts are tokens at the top |
| `assets/js/topology.js` | Draws and animates the network diagram in the hero |
| `assets/fonts/` | Self-hosted Bricolage Grotesque, Instrument Sans and JetBrains Mono (SIL OFL, Latin subset) |
| `assets/img/` | Logo, DashyNMS screenshots and the social sharing image |
| `CNAME` | Custom domain for GitHub Pages |
| `.nojekyll` | Serves files as-is instead of running Jekyll |

## Preview locally

Paths are root-relative, so use a local server rather than opening the file directly:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Editing

- **Network diagram:** devices and links are the `nodes` and `links` lists at the top of `assets/js/topology.js`. Add `'down'` as a third item on a link to draw it as a failed link, or `status: 'warn'` on a node for an amber status light.
- **DashyNMS screenshots:** replace the files in `assets/img/`. Keep `dashynms-dashboard.webp` and `.png` in step.

## Deploying

Push to `main`. GitHub Pages publishes the repository root.
