/**
#!name=JD Cookie Auto Update
#!desc=自动更新京东Cookie到青龙面板，surge修改到loon版，无法自动关闭插件，请获取并替换ck后手动关闭插件。
#!author=[Elvis](https://github.com/ShAlIow)修改
#!homepage=https://raw.githubusercontent.com/ShAlIow/something/Loon/chajian/autorenewptkey.plugin
#!icon=
#!tag = 增强功能
#!input = qinglongHost
#!input = clientId
#!input = clientSecret


[Script]
http-response ^https?:\/\/api\.m\.jd\.com\/client\.action\?functionId=(wareBusiness|serverConfig|basicConfig) script-path=https://raw.githubusercontent.com/ShAlIow/something/Loon/ptkey.js,requires-body=true,tag=JD Cookie Script,enable=true

[MITM]
hostname = %APPEND% api.m.jd.com

**/

// 参数处理
const qinglongHost = $persistentStore.read("qinglongHost");
const clientId = $persistentStore.read("clientId");
const clientSecret = $persistentStore.read("clientSecret");

console.log("qinglongHost = " + qinglongHost);

if (!qinglongHost || !clientId || !clientSecret) {
    console.log("请配置插件参数。");
    $done();
}

// 公共变量
let qinglongToken = "";
let qinglongEnvId = 0;

// 获取 Cookie
var CV = $request.headers["Cookie"] || $request.headers["cookie"];
var jdCookie = CV.match(/pt_pin=.+?;/) + CV.match(/pt_key=.+?;/);

(async function () {
    // 获取 qinglong Token
    await getQinglongToken();

    if (!qinglongToken) {
        console.log('无法获取青龙令牌。');
        $done();
        return;
    }

    // 获取 JD_COOKIE 的 envId
    await getQinglongEnvId();
    if (!qinglongEnvId) {
        console.log('无法获取JD_COOKIE的环境变量ID。');
        $done();
        return;
    }

    await Promise.all([
        // 更新 jd_cookie 值
        updateQinglongEnvValue(),
        // 更新 jd_cookie 状态
        updateQinglongEnvStatus()
    ]);

    // 显示通知
    $notification.post("pt_key", "", "更新成功！");
    // 由于Loon没有$httpAPI方法，这里不自动关闭模块
    // 可以考虑添加一个标志来记录是否已经更新过
    let hasUpdated = $persistentStore.read("hasUpdated");
    if (!hasUpdated) {
        $persistentStore.write("true", "hasUpdated");
    }
    $done();
})();

// 获取青龙令牌
function getQinglongToken() {
    return new Promise((resolve) => {
        const tokenUrl = `${qinglongHost}/api/user/token?client_id=${clientId}&client_secret=${clientSecret}`;
        $httpClient.post(tokenUrl, (error, response, data) => {
            if (error) {
                console.log('获取青龙令牌时发生错误：' + error);
                resolve(false);
            } else {
                const jsonData = JSON.parse(data);
                if (jsonData.code === 200) {
                    qinglongToken = jsonData.data.token;
                    resolve(qinglongToken);
                } else {
                    console.log('获取青龙令牌时发生错误：' + jsonData.message);
                    resolve(false);
                }
            }
        });
    });
}

// 获取JD_COOKIE的环境变量ID
function getQinglongEnvId() {
    return new Promise((resolve) => {
        const envUrl = `${qinglongHost}/api/envs?searchValue=JD_COOKIE`;
        $httpClient.get(envUrl, {
            headers: {
                'Authorization': 'Bearer ' + qinglongToken
            }
        }, (error, response, data) => {
            if (error) {
                console.log('获取JD_COOKIE环境变量ID时发生错误：' + error);
                resolve(false);
            } else {
                const jsonData = JSON.parse(data);
                if (jsonData.code === 200) {
                    const envs = jsonData.data;
                    for (let i = 0; i < envs.length; i++) {
                        if (envs[i].name === "JD_COOKIE") {
                            qinglongEnvId = envs[i]._id;
                            break;
                        }
                    }
                    resolve(qinglongEnvId);
                } else {
                    console.log('获取JD_COOKIE环境变量ID时发生错误：' + jsonData.message);
                    resolve(false);
                }
            }
        });
    });
}

// 更新青龙环境变量值
function updateQinglongEnvValue() {
    return new Promise((resolve) => {
        const updateUrl = `${qinglongHost}/api/envs`;
        $httpClient.put(updateUrl, {
            headers: {
                'Authorization': 'Bearer ' + qinglongToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "name": "JD_COOKIE",
                "value": jdCookie,
                "id": qinglongEnvId
            })
        }, (error, response, data) => {
            if (error) {
                console.log('更新青龙环境变量值时发生错误：' + error);
                resolve(false);
            } else {
                const jsonData = JSON.parse(data);
                if (jsonData.code === 200) {
                    console.log('更新青龙环境变量值成功');
                    resolve(true);
                } else {
                    console.log('更新青龙环境变量值时发生错误：' + jsonData.message);
                    resolve(false);
                }
            }
        });
    });
}

// 更新青龙环境变量状态
function updateQinglongEnvStatus() {
    return new Promise((resolve) => {
        const updateStatusUrl = `${qinglongHost}/api/envs/enable`;
        $httpClient.put(updateStatusUrl, {
            headers: {
                'Authorization': 'Bearer ' + qinglongToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "ids": [qinglongEnvId]
            })
        }, (error, response, data) => {
            if (error) {
                console.log('更新青龙环境变量状态时发生错误：' + error);
                resolve(false);
            } else {
                const jsonData = JSON.parse(data);
                if (jsonData.code === 200) {
                    console.log('更新青龙环境变量状态成功');
                    resolve(true);
                } else {
                    console.log('更新青龙环境变量状态时发生错误：' + jsonData.message);
                    resolve(false);
                }
            }
        });
    });
}