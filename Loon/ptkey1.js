/**
#!name=JD Cookie Auto Update
#!desc=自动更新京东Cookie到青龙面板，surge修改到loon版，无法自动关闭插件，请获取并替换ck后手动关闭插件。
#!author=Elvis[https://github.com/ShAlIow]修改
#!homepage=https://raw.githubusercontent.com/ShAlIow/something/main/Loon/chajian/autorenewptkey.plugin
#!icon=
#!tag = 增强功能
#!input = qinglongHost
#!input = clientId
#!input = clientSecret


[Script]
http-response ^https?:\/\/api\.m\.jd\.com/client\.action\?functionId=(wareBusiness|serverConfig|basicConfig) script-path=https://raw.githubusercontent.com/ShAlIow/something/main/Loon/ptkey.js,requires-body=true,tag=JD Cookie Script,enable=true

[MITM]
hostname = %APPEND% api.m.jd.com
 */
// 参数处理
const qinglongHost = $argument.qinglongHost;
const clientId = $argument.clientId;
const clientSecret = $argument.clientSecret;

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

//主函数
(async function () {
    // 获取 qinglong Token
    await getQinglongToken();

    if (!qinglongToken) {
        console.log('Can not get qinglong token.');
        $done();
        return;
    }

    // 获取 JD_COOKIE 的 envId
    await getQinglongEnvId();
    if (!qinglongEnvId) {
        console.log('Can not get JD_COOKIE env id.');
        $done();
        return;
    }

    await Promise.all([
        // 更新 jd_cookie 值
        updateQinglongEnvValue(),
        // 更新 jd_cookie 状态
        updateQinglongEnvStatus()
    ]);

    // 发送通知，更新成功
    $notification.post("pt_key", "", "Update success!");
    $done();
})();

// 获取 Qinglong Token
function getQinglongToken() {
    return new Promise(async (resolve) => {
        $httpClient.get(
            qinglongHost +
            "/open/auth/token?client_id=" +
            clientId +
            "&client_secret=" +
            clientSecret,
            function (error, response, data) {
                try {
                    if (error) {
                        throw new Error(error);
                        return;
                    }

                    const body = JSON.parse(data);
                    if (body.code == 200) {
                        qinglongToken = body.data.token;
                        // console.log(qinglongToken);
                        resolve(true);
                    } else {
                        throw new Error('get qinglong token error.');
                    }
                } catch (e) {
                    console.log(`error: ${e.message}`);
                } finally {
                    resolve();
                }
            }
        );
    });
}

//获取 Qinglong EnvId
function getQinglongEnvId() {
    return new Promise(async (resolve) => {
        $httpClient.get(
            {
                url: qinglongHost + "/open/envs",
                headers: {
                    Authorization: "Bearer " + qinglongToken,
                    "Content-Type": "application/json"
                }
            },
            function (error, response, data) {
                try {
                    if (error) {
                        throw new Error(error);
                        return;
                    }

                    const body = JSON.parse(data);
                    if (body.code == 200 && body.data.length >= 1) {
                        let jdCookieEnv = body.data.filter(t => t.name == "JD_COOKIE").pop();
                        if (jdCookieEnv) {
                            qinglongEnvId = jdCookieEnv.id;
                            // console.log(qinglongEnvId);
                            resolve(true);
                        }
                    } else {
                        throw new Error('get qinglong evn id error.');
                    }
                } catch (e) {
                    console.log(`error: ${e.message}`);
                } finally {
                    resolve();
                }
            }
        );
    });
}

//更新青龙环境变量值
function updateQinglongEnvValue() {
    return new Promise(async (resolve) => {
        $httpClient.put(
            {
                url: qinglongHost + "/open/envs",
                headers: {
                    Authorization: "Bearer " + qinglongToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: qinglongEnvId, name: "JD_COOKIE", value: jdCookie })
            },
            function (error, response, data) {
                // console.log(data);
                resolve(true);
            }
        );
    });
}

// 更新青龙环境变量状态
function updateQinglongEnvStatus() {
    return new Promise(async (resolve) => {
        $httpClient.put(
            {
                url: qinglongHost + "/open/envs/enable",
                headers: {
                    Authorization: "Bearer " + qinglongToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify([qinglongEnvId])
            },
            function (error, response, data) {
                // console.log(data);
                resolve(true);
            }
        );
    });
}