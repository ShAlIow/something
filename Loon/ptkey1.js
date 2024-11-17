// 参数处理
let qinglongHost = $argument[0];
let clientId = $argument[1];
let clientSecret = $argument[2];

console.log("qinglongHost = " + qinglongHost);

if (!qinglongHost || !clientId || !clientSecret) {
    console.log("请在插件配置中填写必要的参数。");
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
        console.log('无法获取青龙 Token。');
        $done();
        return;
    }

    // 获取 JD_COOKIE 的 envId
    await getQinglongEnvId();
    if (!qinglongEnvId) {
        console.log('无法获取 JD_COOKIE 的环境变量 ID。');
        $done();
        return;
    }

    await Promise.all([
        // 更新 jd_cookie 值
        updateQinglongEnvValue(),
        // 更新 jd_cookie 状态
        updateQinglongEnvStatus()
    ]);

    $notification.post("pt_key 更新成功", "", "已成功更新 JD_COOKIE。");

    $done();
})();

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
                    console.log(`\nerror: ${e.message}`);
                } finally {
                    resolve();
                }
            }
        );
    });
}

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
                    console.log(`\nerror: ${e.message}`);
                } finally {
                    resolve();
                }
            }
        );
    });
}

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