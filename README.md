# anibar

A personalized fork of [ani-cli](https://github.com/pystardust/ani-cli) — browse and watch anime from the terminal.

All the scraping core is the work of [pystardust and the ani-cli contributors](https://github.com/pystardust/ani-cli). Please check them out — anibar is a personal build on top of their project.

## What's different from ani-cli

- Watched-episode tracking: episodes you play get a green ✓ in the episode menu, the Right arrow key toggles the mark on any episode, and `--seen` / `--unseen` bulk-mark series you watched elsewhere
- Search results sorted by release year, so seasons appear in watch order
- Filemoon provider enabled for better source coverage, especially on newer seasons
- Implements mkissa.to's current client-crypto handshake (bootstrap, per-epoch key, `aaReq`), with an oracle script to refresh the constants when the site rotates them; upstream ani-cli dropped allanime instead
- Tracks upstream hotfixes (`fix` branch) so scraper repairs land fast
- macOS portability fix for the API request auth (`base64 -w` is not a thing on BSD)
- Runs on Windows in Git Bash: the API auth step that needs botan elsewhere falls back to the built-in Windows PowerShell, and an `anibar.cmd` launcher makes it callable from PowerShell/cmd too
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

### Windows

Runs natively in Git Bash, the shell that ships with Git for Windows — no WSL needed. Windows Terminal is the nicest way to use it, but the plain "Git Bash" window from the Start menu works too.

From PowerShell, install the dependencies:

```powershell
winget install --id Git.Git -e
winget install --id junegunn.fzf -e
winget install --id mpv-player.mpv-CI.MSVC -e
```

Git for Windows brings `curl`, `openssl`, `patch` and the other Unix tools. Botan has no Windows package, so on Windows anibar does that step with the built-in Windows PowerShell instead — nothing extra to install. For download mode (`-d`) also add `Gyan.FFmpeg` and `aria2.aria2` the same way (`yt-dlp.yt-dlp` optional).

Put `%USERPROFILE%\.local\bin` on your PATH once (still in PowerShell), then close and reopen your terminals:

```powershell
[Environment]::SetEnvironmentVariable('Path', "$([Environment]::GetEnvironmentVariable('Path', 'User'));$env:USERPROFILE\.local\bin", 'User')
```

Then in Git Bash:

```sh
git clone https://github.com/rehcte/anibar.git
cd anibar
install -Dm755 ani-cli ~/.local/bin/anibar
cp anibar.cmd ~/.local/bin/
```

`anibar.cmd` is a small launcher so you can type `anibar` from PowerShell or cmd as well; skip it if you only use Git Bash. If Windows Terminal has no Git Bash tab, re-run the Git installer and tick "Add a Git Bash Profile to Windows Terminal", or just run anibar from the PowerShell tab through the launcher.

VLC works too (`anibar -v`): `winget install --id VideoLAN.VLC -e`, anibar finds it in the default install folder.

Moving over from Linux? Copy `~/.local/state/ani-cli/ani-hsts` and `ani-seen` to `C:\Users\<you>\.local\state\ani-cli\` to keep your history and watched marks.

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

Windows (in Git Bash):

```sh
cd anibar
git pull
install -Dm755 ani-cli ~/.local/bin/anibar
```

## When mkissa rotates its crypto

Source fetching talks to mkissa.to's (allanime's) client-crypto handshake: a signed `x-aa-boot` bootstrap, a per-epoch AES key and an encrypted `aaReq` token on every episode request. The site rotates the build id, the key mask and the shape of the boot signature every week or two, and anibar then stops with "mkissa.to refused the client handshake". The constants live in the `mk_*` block near the top of the main section of `ani-cli`; to refresh them, run the oracle, which drives the real site in a headless Chrome or Edge and prints a verified block to paste over the old one:

```sh
cd tools
npm install
node mkissa-oracle.js
```

It needs Node and a Chromium-based browser on the machine. If it exits with "scheme drift", the site changed more than the constants and the shell code needs a look.

## Credits and license

Built on [pystardust/ani-cli](https://github.com/pystardust/ani-cli), licensed [GPL-3.0](LICENSE) like the original. See their [disclaimer](disclaimer.md), which applies here too.
