// version v0.0.2
// create by ruicky
// detail url: https://github.com/ruicky/jd_sign_bot

const exec = require('child_process').execSync;
const fs = require('fs');
const rp = require('request-promise');
const download = require('download');

// 公共变量
const KEY = process.env.JD_COOKIE;
const WXBOT = process.env.PUSH_KEY;
const DualKey = process.env.JD_COOKIE_2;


async function downFile() {
  // const url = 'https://cdn.jsdelivr.net/gh/NobyDa/Script@master/JD-DailyBonus/JD_DailyBonus.js'
  const url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js';
  await download(url, './');
}

async function changeFile() {
  let content = await fs.readFileSync('./JD_DailyBonus.js', 'utf8')
  content = content.replace(/var Key = ''/, `var Key = '${KEY}'`);
  if (DualKey) {
    content = content.replace(/var DualKey = ''/, `var DualKey = '${DualKey}'`);
  }
  await fs.writeFileSync('./JD_DailyBonus.js', content, 'utf8')
}

async function sendWecom(content) {
  const e = WXBOT.split(",")
  const tokenOptions = {
    uri: 'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
    qs: {
      'corpid': e[0],
      'corpsecret': e[1],
    },
    json: true
  }
  var token = ""
  await rp(tokenOptions).then(res => {
    token = res["access_token"]
  })
  const send_url = 'https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=' + token
  const msgOptions = {
    uri: send_url,
    body: {
      "touser": "@all",
      "msgtype": "text",
      "agentid": e[2],
      "text": {
        "content": content
      }
    },
    json: true,
    method: 'POST'
  }
  await rp.post(msgOptions).then(res => {
    console.log(res["errMsg"])
  })
}

async function start() {
  if (!KEY) {
    console.log('请填写 key 后在继续')
    return
  }
  // 下载最新代码
  await downFile();
  console.log('下载代码完毕')
  // 替换变量
  await changeFile();
  console.log('替换变量完毕')
  // 执行
  await exec("node JD_DailyBonus.js >> result.txt");
  console.log('执行完毕')

  if (WXBOT) {
    const path = "./result.txt";
    let content = "";
    if (fs.existsSync(path)) {
      content = fs.readFileSync(path, "utf8");
    }
    let t = content.match(/签到概览((.|\n)*)京东/)
    let res = t ? t[1].replace(/\n/, '') : '失败'

    await sendWecom(` ${res} ` + new Date().toLocaleDateString() + "\n" + content);
  }
}

start()
