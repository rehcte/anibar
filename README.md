# anibar

A personalized fork of [ani-cli](https://github.com/pystardust/ani-cli) — browse and watch anime from the terminal.

All the scraping core is the work of [pystardust and the ani-cli contributors](https://github.com/pystardust/ani-cli). Please check them out — anibar is a personal build on top of their project.

## What's different from ani-cli

- Watched-episode tracking: episodes you play get a green ✓ in the episode menu, the Right arrow key toggles the mark on any episode, and `--seen` / `--unseen` bulk-mark series you watched elsewhere
- Search results sorted by release year, so seasons appear in watch order
- Filemoon provider enabled for better source coverage, especially on newer seasons
- Tracks upstream hotfixes (`fix` branch) so scraper repairs land fast
- macOS portability fix for the API request auth (`base64 -w` is not a thing on BSD)
- Planned: watched-episode checkmarks, mark-as-watched, and a watchlist

## Install

### Linux

Dependencies: `curl` `fzf` `mpv` `openssl` `botan` `patch` (plus `aria2` and `ffmpeg` if you use download mode).

Arch and derivatives:

```sh
sudo pacman -S --needed curl fzf mpv openssl botan patch
```

Other distros: install the equivalents from your package manager.

Then:

```sh
git clone https://github.com/rehcte/anibar.git
cd anibar
install -Dm755 ani-cli ~/.local/bin/anibar
```

Make sure `~/.local/bin` is in your `PATH`.

### macOS

Install [Homebrew](https://docs.brew.sh/Installation) if you don't have it, then:

```sh
brew tap rehcte/anibar https://github.com/rehcte/anibar.git
brew install --HEAD rehcte/anibar/anibar
brew install --cask iina
```

If your brew complains about untrusted taps, run `brew trust rehcte/anibar` first.

IINA is the recommended player on macOS (drop-in mpv replacement that integrates with the OS UI). Plain `mpv` from brew works too.

### iPhone / iPad

Runs inside [iSH](https://apps.apple.com/us/app/ish-shell/id1436902243), a terminal emulator from the App Store. Playback happens in [VLC for iOS](https://apps.apple.com/us/app/vlc-media-player/id650377962) — install both first.

In iSH:

```sh
apk update
apk add git curl fzf sed grep openssl botan3 patch
git clone https://github.com/rehcte/anibar.git
cd anibar
install -Dm755 ani-cli /usr/local/bin/anibar
```

If `apk` can't find `botan3`, your iSH is on an older Alpine branch — point `/etc/apk/repositories` at a newer release and `apk update` again.

Run `anibar <anime name>`, pick your episode, then tap the "Tap to open VLC" link that appears — VLC opens and plays the stream.

Heads up: iSH is an emulator, so the menus feel slow (playback in VLC is full speed), and a few titles that only stream from the Yt source won't play on iOS — the script filters those out because VLC-iOS can't handle them.

## Usage

```sh
anibar <anime name>        # search and watch
anibar -c                  # continue from history
anibar -e 5 bleach         # jump to episode 5
anibar -e 5-8 bleach       # episodes 5 through 8
anibar -q 720 bleach       # pick a quality
anibar --dub bleach        # dubbed version
```

Run `anibar -h` for everything else.

## Updating

Linux:

```sh
cd anibar
git pull
install -Dm755 ani-cli ~/.local/bin/anibar
```

macOS:

```sh
brew upgrade --fetch-HEAD rehcte/anibar/anibar
```

## Credits and license

Built on [pystardust/ani-cli](https://github.com/pystardust/ani-cli), licensed [GPL-3.0](LICENSE) like the original. See their [disclaimer](disclaimer.md), which applies here too.
