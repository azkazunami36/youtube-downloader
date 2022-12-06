addEventListener("load", async () => {
    document.getElementById("button").addEventListener("click", () => { });

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "http://" + location.hostname + ":" + location.port + "/video");
    xhr.setRequestHeader("content-type", "text/plain;charset=UTF-8");
    const url = document.getElementById("text").value;
    xhr.send("url=" + url);
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) { //通信が完了し、成功をマークしていたら
            console.log(xhr.responseText);
        };
    };
    (await fetch("stylesheet")).text().then(data => document.getElementsByTagName("style")[0].innerHTML = data);
});