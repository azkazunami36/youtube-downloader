/**
 * Numberで構成された秒数を文字列「x時間x分x秒」に変換します。
 * @param {Number} sec 秒数を入力します。
 * @returns 文字列を返します。
 */
const time = (sec) => {
    let output = "";
    let hour = (sec / 60 / 60).toFixed();
    for (let i = 0; hour > 60; i++) hour -= 60;
    let minute = (sec / 60).toFixed();
    for (let i = 0; minute > 60; i++) minute -= 60;
    let second = sec.toFixed();
    for (let i = 0; second > 60; i++) second -= 60;
    if (hour != 0) output += hour + "時間";
    if (minute != 0) output += minute + "分";
    if (second != 0) output += second + "秒";
    return output;
};
/**
 * 数値をByteからMBに変換します。
 * @param {Number} byte Byteを入力します。
 * @returns {Number} MBを返します。
 */
const mb = (byte) => { return (byte / 1024 / 1024).toFixed(1); };

module.exports = {
    time, mb
};