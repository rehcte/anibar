class Anibar < Formula
  desc "Personalized ani-cli fork to browse and watch anime from the terminal"
  homepage "https://github.com/rehcte/anibar"
  license "GPL-3.0-only"
  head "https://github.com/rehcte/anibar.git", branch: "main"

  depends_on "aria2"
  depends_on "botan"
  depends_on "ffmpeg"
  depends_on "fzf"
  depends_on "grep"
  depends_on "yt-dlp"
  depends_on "mpv" => :recommended

  def install
    bin.install "ani-cli" => "anibar"
    man1.install "ani-cli.1" => "anibar.1"
  end

  def caveats
    <<~EOS
      On macOS you can install the IINA player instead of mpv:
        brew install --cask iina
    EOS
  end

  test do
    assert_match(/\d+\.\d+/, shell_output("#{bin}/anibar --version"))
  end
end
