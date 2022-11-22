const app = require("express")();
const port = parseInt(process.env.PORT || "81", 10);
const readline = require("readline");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { mb, time } = require("./function");
const cors = require("cors");
app.listen(port, async () => {
    let address = "http://localhost";
    if (port != "80") address += ":" + port;
    console.info("ポート" + port + "でWebを公開しました！ " + address + " にアクセスしてダウンロードしましょう！");
});
app.use(cors());

app.get("/*", async (req, res) => {
    console.log(req.url);
    switch (req.url) {
        case "/": {
            res.header("Content-Type", "text/html;charset=utf-8");
            res.end(fs.readFileSync("index.html"));
            break;
        }
        case "/javascript": {
            res.header("Content-Type", "text/html;charset=utf-8");
            res.end(fs.readFileSync("index.js"));
            break;
        }
        case "/stylesheet": {
            res.header("Content-Type", "text/html;charset=utf-8");
            res.end(fs.readFileSync("stylesheet.css"));
            break;
        }
    }
});

app.post("/*", async (req, res) => {
    console.log(req.url);
    switch (req.url) {
        case "/video": {
            let json;
            const req = require("http").request("http://localhost", {
                port: 3000,
                method: "post",
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            req.on("response", res => {
                let data = "";
                res.on("data", chunk => { data += chunk; });
                res.on("end", () => { json = JSON.stringify(JSON.parse(data).youtube_data); });
            });
            req.write(JSON.stringify([""]));
            req.on("error", err => console.log());
            req.end();
            res.header("Content-Type", "text/plain;charset=utf-8");
            res.end(json);
            break;
        }
        case "/download": {
            const error = err => {
                if (err) {
                    console.log(err);
                    res.status(400).send("YouTubeをダウンロードする時にエラーが発生しました。もう一度やり直してください。\nネットワークに接続されていないか、URLが正しいか確認してください。");
                } else {
                    console.log("エラーは検出されませんでした。");
                };
            };
            let data = "";
            req.on("data", async chunk => data += chunk);
            req.on("end", async () => {
                console.log("post: " + data);
                const id = require("ytdl-core").getURLVideoID(require("querystring").parse(data).url);
                if (!fs.existsSync("cache")) fs.mkdirSync("cache");
                const download = async title => {
                    console.log("\n\n動画ファイルの準備が完了しました。\nダウンロードを開始します。");
                    res.download("cache/" + id + ".mp4", title + ".mp4", error => console.log(error));
                };
                require("ytdl-core").getInfo(id).then(async (info) => {
                    console.log("情報取得完了: " + id + " タイトル:" + info.player_response.videoDetails.title);
                    if (!fs.existsSync("cache/" + id + ".mp4")) {
                        let starttime;
                        const ytdl = require("ytdl-core")(id, { filter: "videoonly", quality: "highest" });
                        ytdl.once("response", () => { starttime = Date.now(); console.log("動画のダウンロードを開始します。"); });
                        ytdl.on("progress", (chunkLength, downloaded, total) => {
                            const floatDownloaded = downloaded / total;
                            const downloadedSeconds = (Date.now() - starttime) / 1000;
                            readline.cursorTo(process.stdout, 0);
                            process.stdout.write((floatDownloaded * 100).toFixed() + "% ダウンロード完了。(" + mb(downloaded) + "MB 中 " + mb(total) + "MB) " + time(downloadedSeconds) + "経過 推定残り時間: " + time(downloadedSeconds / floatDownloaded - downloadedSeconds));
                        });
                        ytdl.on("error", async err => { error(err); console.log("error"); });
                        ytdl.pipe(fs.createWriteStream("cache/" + id + "-y.mp4"));
                        const audio = async () => {
                            console.log("\n\n動画のダウンロードが完了しました。\n次に音声をダウンロードします。");
                            const ytdl = require("ytdl-core")(id, { filter: "audioonly", quality: "highest" });
                            ytdl.once("response", () => { starttime = Date.now(); console.log("音声のダウンロードを開始します。"); });
                            ytdl.on("progress", (chunkLength, downloaded, total) => {
                                const floatDownloaded = downloaded / total;
                                const downloadedSeconds = (Date.now() - starttime) / 1000;
                                readline.cursorTo(process.stdout, 0);
                                process.stdout.write((floatDownloaded * 100).toFixed() + "% ダウンロード完了。(" + mb(downloaded) + "MB 中 " + mb(total) + "MB) " + time(downloadedSeconds) + "経過 推定残り時間: " + time(downloadedSeconds / floatDownloaded - downloadedSeconds));
                            });
                            ytdl.on("error", async err => { error(err); console.log("error"); });
                            ytdl.pipe(fs.createWriteStream("cache/" + id + "-y.mp3"));
                            ytdl.on("end", ffmpegs);
                        };
                        const ffmpegs = async () => {
                            console.log("\n\n音声のダウンロードが完了しました。\n次にFFmpegでファイルを変換します。");
                            const prog = ffmpeg()
                            prog.addInput("cache/" + id + "-y.mp4")
                            prog.addInput("cache/" + id + "-y.mp3")
                            prog.videoCodec("copy")
                            prog.audioCodec("aac")
                            prog.addOptions(["-map 0:v:0", "-map 1:a:0"])
                            prog.save("cache/" + id + ".mp4")
                            prog.on("start", async commandLine => { starttime = Date.now(); console.log("FFmpegでの処理を開始します。" + commandLine); })
                            prog.on("progress", async progress => {
                                const downloadedSeconds = (Date.now() - starttime) / 1000;
                                let percent = time(downloadedSeconds / progress.percent - downloadedSeconds);
                                if (!progress.percent) percent = "利用不可";
                                readline.cursorTo(process.stdout, 0);
                                process.stdout.write(progress.frames + "フレーム処理しました。(" + progress.currentFps + " fps) " + time(downloadedSeconds) + "経過 推定残り時間: " + percent);
                                readline.moveCursor(process.stdout, 0, 0);
                            })
                            prog.on("end", () => {
                                fs.unlinkSync("cache/" + id + "-y.mp4");
                                fs.unlinkSync("cache/" + id + "-y.mp3");
                                download(info.player_response.videoDetails.title);
                            });
                        };
                        ytdl.once("end", audio);
                    } else { download(info.player_response.videoDetails.title) };
                });
            });
            break;
        }
    }
});