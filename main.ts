import ytdl from "ytdl-core";
import fs from "fs";
import fluentFfmpeg from "fluent-ffmpeg";

if (!fs.existsSync("cache")) fs.mkdirSync("cache");

const url = "https://www.youtube.com/watch?v=8ytKQE-8-Hw";

const videoId = ytdl.getURLVideoID(url);

function ffprobe(path: string) {
    return new Promise<fluentFfmpeg.FfprobeData>((resolve, reject) => {
        fluentFfmpeg.ffprobe(path, (err, metadata) => {
            if (err) reject(err);
            resolve(metadata);
        });
    });
}

(async () => {
    const videoInfo = await ytdl.getInfo(videoId);
    function download(type: "video" | "audio") {
        return new Promise<void>((resolve, reject) => {
            const video = ytdl.downloadFromInfo(videoInfo, { filter: type === "video" ? "videoonly" : "audioonly", quality: "highest" });
            video.on("end", () => { resolve(); });
            video.on("error", (err) => { reject(err); });
            video.pipe(fs.createWriteStream(`cache/${videoId}-${type}.mkv`));
        });
    }
    console.log(videoInfo.videoDetails.title);
    await download("video");
    await download("audio");

    const metadataVideo = await ffprobe(`cache/${videoId}-video.mkv`);
    const metadataAudio = await ffprobe(`cache/${videoId}-audio.mkv`);

    const ffmpeg = fluentFfmpeg();
    ffmpeg.input(`cache/${videoId}-video.mkv`);
    ffmpeg.input(`cache/${videoId}-audio.mkv`);
    ffmpeg.outputOptions("-c:v", metadataVideo.streams[0].codec_name === "h264" ? "copy" : "libx264");
    ffmpeg.outputOptions("-c:a", metadataAudio.streams[0].codec_name === "aac" ? "copy" : "aac");
    ffmpeg.outputOptions("-crf", "22");
    ffmpeg.outputOptions("-b:a", "128k");
    ffmpeg.outputOptions("-tag:v", "avc1");
    ffmpeg.output(`cache/${videoId}.mp4`);
    ffmpeg.on("end", () => { console.log("Converted, " + metadataVideo.streams[0].codec_name + " to h264 & " + metadataAudio.streams[0].codec_name + " to aac."); });
    ffmpeg.on("error", (err) => { console.error(err); });
    ffmpeg.run();
    console.log("Downloaded");
})();

