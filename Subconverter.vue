<template>
  <div>
    <el-row style="margin-top: 50px">
      <el-col>
        <el-card style="margin-top:20px;max-width:800px;margin:auto;opacity:0.8;blackground-color:#0F4677;border-radius: 20px;">
          <div slot="header" style="blackground-color:#0F4677;text-align:center;font-size :25px !important;font-weight: bold !important;">
            Elvisの订阅转换
          </div>
          <el-container>
            <el-form :model="form" label-width="80px" label-position="left" style="width: 100%">
              <el-form-item label="模式设置:">
                <el-radio v-model="advanced" label="1">基础模式</el-radio>
                <el-radio v-model="advanced" label="2">进阶模式</el-radio>
              </el-form-item>
              <el-form-item label="订阅链接:">
                <el-input v-model="form.sourceSubUrl" type="textarea" rows="3"
                  placeholder="支持订阅或ss/ssr/vmess链接，多个链接每行一个或用 | 分隔" @blur="saveSubUrl" />
              </el-form-item>
              <el-form-item label="客户端:">
                <el-select v-model="form.clientType" style="width: 100%">
                  <el-option v-for="(v, k) in options.clientTypes" :key="k" :label="k" :value="v"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="后端地址:">
                  <el-select v-model="form.customBackend" allow-create filterable placeholder="请选择" style="width: 100%">
                    <el-option v-for="(v, k) in options.customBackend" :key="k" :label="k" :value="v"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="远程配置:">
                  <el-select v-model="form.remoteConfig" allow-create filterable placeholder="请选择" style="width: 100%">
                    <el-option-group v-for="group in options.remoteConfig" :key="group.label" :label="group.label">
                      <el-option v-for="item in group.options" :key="item.value" :label="item.label"
                        :value="item.value"></el-option>
                    </el-option-group>
                    <el-button slot="append" @click="gotoRemoteConfig" icon="el-icon-link">配置示例</el-button>
                  </el-select>
                </el-form-item>
              <div v-if="advanced === '2'">
                
                <el-form-item label="包含节点:">
                  <el-input v-model="form.includeRemarks" placeholder="节点名包含的关键字，支持正则" />
                </el-form-item>
                <el-form-item label="排除节点:">
                  <el-input v-model="form.excludeRemarks" placeholder="节点名不包含的关键字，支持正则" />
                </el-form-item>
                <el-form-item label="输出名称:">
                  <el-input v-model="form.filename" placeholder="返回的订阅文件名" />
                </el-form-item>
                <el-form-item label-width="0px">
                  <el-row type="flex">
                    <el-col>
                      <el-checkbox v-model="form.nodeList" label="输出为 Node List" border></el-checkbox>
                    </el-col>
                    <el-popover placement="bottom" v-model="form.extraset">
                      <el-row>
                        <el-checkbox v-model="form.emoji" label="Emoji"></el-checkbox>
                      </el-row>
                      <el-row>
                        <el-checkbox v-model="form.scv" label="跳过证书验证"></el-checkbox>
                      </el-row>
                      <el-row>
                        <el-checkbox v-model="form.udp" @change="needUdp = true" label="启用 UDP"></el-checkbox>
                      </el-row>
                      <el-row>
                        <el-checkbox v-model="form.appendType" label="节点类型"></el-checkbox>
                      </el-row>
                      <el-row>
                        <el-checkbox v-model="form.sort" label="排序节点"></el-checkbox>
                      </el-row>
                      <el-row>
                        <el-checkbox v-model="form.fdn" label="过滤非法节点"></el-checkbox>
                      </el-row>
                      <el-button slot="reference">更多选项</el-button>
                    </el-popover>
                    <el-popover placement="bottom" style="margin-left: 10px">
                      <el-row>
                        <el-checkbox v-model="form.tpl.surge.doh" label="Surge.DoH"></el-checkbox>
                      </el-row>
                      <el-row>
                        <el-checkbox v-model="form.tpl.clash.doh" label="Clash.DoH"></el-checkbox>
                      </el-row>
                      <el-row>
                        <el-checkbox v-model="form.insert" label="网易云"></el-checkbox>
                      </el-row>
                      <el-button slot="reference">定制功能</el-button>
                    </el-popover>
                  </el-row>
                </el-form-item>
              </div>

              <div style="margin-top: 50px"></div>

              <el-divider content-position="center">
                <i class="el-icon-magic-stick"></i>
              </el-divider>

              <el-form-item label="定制订阅:">
                <el-input class="copy-content" disabled v-model="customSubUrl">
                  <el-button slot="append" v-clipboard:copy="customSubUrl" v-clipboard:success="onCopy" ref="copy-btn"
                    icon="el-icon-document-copy">复制</el-button>
                </el-input>
              </el-form-item>
              <el-form-item label="订阅短链:">
                <el-input class="copy-content" disabled v-model="curtomShortSubUrl">
                  <el-button slot="append" v-clipboard:copy="curtomShortSubUrl" v-clipboard:success="onCopy"
                    ref="copy-btn" icon="el-icon-document-copy">复制</el-button>
                </el-input>
              </el-form-item>

              <el-form-item label-width="0px" style="margin-top: 40px; text-align: center">
                <el-button style="width: 140px" type="danger" @click="makeUrl"
                  :disabled="form.sourceSubUrl.length === 0">生成订阅链接</el-button>
                <el-button style="width: 140px" type="danger" @click="makeShortUrl" :loading="loading"
                  :disabled="customSubUrl.length === 0">生成短链接</el-button>
                <!-- <el-button style="width: 140px" type="primary" @click="surgeInstall" icon="el-icon-connection">一键导入Surge</el-button> -->
              </el-form-item>

              <el-form-item label-width="0px" style="text-align: center">
                <el-button style="width: 140px" type="primary" @click="dialogUploadConfigVisible = true"
                  icon="el-icon-upload" :loading="loading">上传配置</el-button>
                <el-button style="width: 140px" type="primary" @click="clashInstall" icon="el-icon-connection"
                  :disabled="customSubUrl.length === 0">一键导入 Clash</el-button>
              </el-form-item>
              <el-form-item label-width="0px" style="text-align: center">
                <el-button style="width: 290px" type="primary" @click="dialogLoadConfigVisible = true"
                  icon="el-icon-copy-document" :loading="loading">从 URL 解析</el-button>
              </el-form-item>
            </el-form>
          </el-container>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog :visible.sync="dialogUploadConfigVisible" :show-close="false" :close-on-click-modal="false"
      :close-on-press-escape="false" width="700px">
      <div slot="title">
        Remote config upload
        <el-popover trigger="hover" placement="right" style="margin-left: 10px">
          <el-link type="primary" :href="sampleConfig" target="_blank" icon="el-icon-info">参考配置</el-link>
          <i class="el-icon-question" slot="reference"></i>
        </el-popover>
      </div>
      <el-form label-position="left">
        <el-form-item prop="uploadConfig">
          <el-input v-model="uploadConfig" type="textarea" :autosize="{ minRows: 15, maxRows: 15 }" maxlength="10000"
            show-word-limit></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="uploadConfig = ''; dialogUploadConfigVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmUploadConfig" :disabled="uploadConfig.length === 0">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogLoadConfigVisible" :show-close="false" :close-on-click-modal="false"
      :close-on-press-escape="false" width="700px">
      <div slot="title">
        解析 Subconverter 链接
      </div>
      <el-form label-position="left" :inline="true" >
        <el-form-item prop="uploadConfig" label="订阅链接：" label-width="85px">
          <el-input v-model="loadConfig" style="width: 565px"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="loadConfig = ''; dialogLoadConfigVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmLoadConfig" :disabled="loadConfig.length === 0">确 定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
const project = process.env.VUE_APP_PROJECT
const remoteConfigSample = process.env.VUE_APP_SUBCONVERTER_REMOTE_CONFIG
const gayhubRelease = process.env.VUE_APP_BACKEND_RELEASE
const defaultBackend = process.env.VUE_APP_SUBCONVERTER_DEFAULT_BACKEND + '/sub?'
const shortUrlBackend = process.env.VUE_APP_MYURLS_API
const configUploadBackend = process.env.VUE_APP_CONFIG_UPLOAD_API
const tgBotLink = process.env.VUE_APP_BOT_LINK

export default {
  data() {
    return {
      backendVersion: "",
      advanced: "1",

      // 是否为 PC 端
      isPC: true,

      options: {
        clientTypes: {
          Clash: "clash",
          ClashR: "clashr",
          Surge2: "surge&ver=2",
          Surge3: "surge&ver=3",
          Surge4: "surge&ver=4",
          Quantumult: "quan",
          QuantumultX: "quanx",
          Loon: "loon",
          Mellow: "mellow",
          Surfboard: "surfboard",
          ss: "ss",
          SSAndroid: "sssub",
          ssr: "ssr",
          ssd: "ssd",
          V2Ray: "v2ray",
          Trojan: "trojan",
          "混合订阅（mixed）": "mixed",
          "自动判断客户端": "auto",
        },
        customBackend: {
          "Elvis自用后端": "https://aft.silves.eu.org/sub?",
          "つつの专属后端 (六核负载均衡-支持IPv4/IPv6)": "https://api.tsutsu.one/sub?",
          "EdNovas自用后端": "https://subsc.ednovas.xyz/sub?",
          "api.tsutsu.cc (つつ提供-国内裸奔小鸡)": "http://api.tsutsu.cc:520/sub?",
          "api2.tsutsu.cc (つつ提供-香港稳定)": "https://api2.tsutsu.cc/sub?",
          "api.v1.mk（肥羊提供-四端八核负载)": "https://api.v1.mk/sub?",
          "subcon.dlj.tf (subconverter作者提供) ": "https://subcon.dlj.tf/sub?",
          "api.dler.io (sub作者&lhie1提供)": "https://api.dler.io/sub?",
          "api.wcc.best (sub-web作者提供)": "https://api.wcc.best/sub?",
          "api.hope140.live (hope提供-vercel)": "https://api.hope140.live/sub?",
          "sub.proxypoolv2.tk (Allen Xu提供-vercel)": "https://sub.proxypoolv2.tk/sub?",
          "jp-aws.proxypoolv2.tk (Allen Xu提供-日本AWS）": "http://jp-aws.proxypoolv2.tk:25500/sub?",
          "sub.id9.cc (品云提供)": "https://sub.id9.cc/sub?",
        },
        backendOptions: [
          { value: "https://aft.silves.eu.org/sub?" },
          { value: "https://api.tsutsu.one/sub?" },
          { value: "https://subsc.ednovas.xyz/sub?" },
          { value: "http://api.tsutsu.cc:520/sub?" },
          { value: "https://api2.tsutsu.cc/sub?" },
          { value: "https://api.v1.mk/sub?" },
          { value: "https://subcon.dlj.tf/sub?" },
          { value: "https://api.dler.io/sub?" },
          { value: "https://api.wcc.best/sub?" },
          { value: "https://api.hope140.live/sub?" },
          { value: "https://sub.proxypoolv2.tk/sub?" },
          { value: "http://jp-aws.proxypoolv2.tk:25500/sub?" },
          { value: "https://sub.id9.cc/sub?" },    
    ],
        remoteConfig: [
          {
            label: "つつの专属规则",
            options: [
              {
                label: "つつ-全分组",
                value:
                  "https://cdn.jsdelivr.net/gh/lhl77/sub-ini@main/tsutsu-full.ini"
              },
              {
                label: "つつ-全分组-地区自动选择",
                value:
                  "https://cdn.jsdelivr.net/gh/lhl77/sub-ini@main/tsutsu-full-urltest.ini"
              },
              {
                label: "つつ-超jb精简分组-含国内分流",
                value:
                  "https://cdn.jsdelivr.net/gh/lhl77/sub-ini@main/tsutsu-mini-gfw.ini"
              },
            ]
          },
	{
            label: "つつの机场定制",
            options: [
              {
                label: "Immtelecom",
                value:
                  "https://cdn.jsdelivr.net/gh/lhl77/sub-ini@main/tsutsu-full-urltest-imm.ini"
              },
              {
                label: "Skicat",
                value:
                  "https://cdn.jsdelivr.net/gh/lhl77/sub-ini@main/tsutsu-full-skicat.ini"
              },
              {
                label: "Maoport",
                value:
                  "https://raw.githubusercontent.com/lhl77/sub-ini/main/tsutsu-maoport-full.ini"
              },
            ]
          },
          {
            label: "用户投稿,投稿请tg找 @Ox208",
            options: [
              {
                label: "hope140自用配置 (与Github同步)",
                value:
                  "https://cdn.staticaly.com/gh/hope140/Clash/beta/hope140.yaml"
              },
              {
                label: "hope140去广告配置",
                value:
                  "https://cdn.staticaly.com/gh/hope140/Clash/beta/Adblock.yaml"
              },
              {
                label: "hope140全分组",
                value:
                  "https://cdn.staticaly.com/gh/hope140/Clash/beta/All.yaml"
              },
              {
                label: "Yuki隐藏国内IP属地-极简",
                value:
                  "https://raw.githubusercontent.com/godlikeanyone/Rules/master/subconvert.ini"
              },
              {
                label: "AllenXu精简版多国家",
                value:
                  "https://raw.githubusercontent.com/hyt-allen-xu/webcdn/master/cdn_multicountry.ini"
              },
              {
                label: "AllenXu小机场专用",
                value:
                  "https://raw.githubusercontent.com/hyt-allen-xu/webcdn/master/smallairport.ini"
              },
              {
                label: "酷酷规则",
                value:
                  "https://raw.githubusercontent.com/xiaoshenxian233/cool/rule/coolcool.ini"
              },
              {
                label: "NormalPeople 规则集 (仅P核)",
                value:
                  "https://raw.githubusercontent.com/wyk19/subconverter-web/master/rules/rule-set.ini"
              },
            ]
          },
          {
            label: "ACL4SSR",
            options: [
              {
                label: "ACL4SSR默认",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online.ini"
              },
              {
                label: "ACL4SSR去广告",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_AdblockPlus.ini"
              },
              {
                label: "ACL4SSR无自动测速",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_NoAuto.ini"
              },
              {
                label: "ACL4SSR无广告拦截",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_NoReject.ini"
              },
              {
                label: "ACL4SSR精简版",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini.ini"
              },
              {
                label: "ACL4SSR精简去广告",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_AdblockPlus.ini"
              },
              {
                label: "ACL4SSR精简多重模式",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Mini_MultiMode.ini"
              },
              {
                label: "ACL4SSR精简版带港美日国家",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_MultiCountry.ini"
              },
              {
                label: "ACL4SSR全分组",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full.ini"
              },
              {
                label: "ACL4SSR全分组多模式",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_MultiMode.ini"
              },
              {
                label: "ACL4SSR全分组重度用户",
                value:
                  "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_Netflix.ini"
              }
            ]
          },
          {
            label: "特殊",
            options: [
              {
                label: "基础无规则",
                value:
                  "https://subconverter.oss-ap-southeast-1.aliyuncs.com/Rules/RemoteConfig/special/basic.ini"
              },
              {
                label: "clash防DNS泄露",
                value:
                  "https://raw.githubusercontent.com/ShAlIow/something/main/ini"
              },
              {
                label: "shadowrocket防DNS泄露",
                value:
                  "https://raw.githubusercontent.com/ShAlIow/something/main/hjini"
              }
            ]
          },
          {
label: "ACL4SSR",
options: [
{
label: "ACL4SSR_Online 默认版 分组比较全 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online.ini"
},
{
label: "ACL4SSR_Online_AdblockPlus 更多去广告 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_AdblockPlus.ini"
},
{
label: "ACL4SSR_Online_NoAuto 无自动测速 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_NoAuto.ini"
},
{
label: "ACL4SSR_Online_NoReject 无广告拦截规则 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_NoReject.ini"
},
{
label: "ACL4SSR_Online_Mini 精简版 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini.ini"
},
{
label: "ACL4SSR_Online_Mini_AdblockPlus.ini 精简版 更多去广告 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_AdblockPlus.ini"
},
{
label: "ACL4SSR_Online_Mini_NoAuto.ini 精简版 不带自动测速 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_NoAuto.ini"
},
{
label: "ACL4SSR_Online_Mini_Fallback.ini 精简版 带故障转移 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_Fallback.ini"
},
{
label: "ACL4SSR_Online_Mini_MultiMode.ini 精简版 自动测速、故障转移、负载均衡 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_MultiMode.ini"
},
{
label: "ACL4SSR_Online_Full 全分组 重度用户使用 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full.ini"
},
{
label: "ACL4SSR_Online_Full_NoAuto.ini 全分组 无自动测速 重度用户使用 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_NoAuto.ini"
},
{
label: "ACL4SSR_Online_Full_AdblockPlus 全分组 重度用户使用 更多去广告 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_AdblockPlus.ini"
},
{
label: "ACL4SSR_Online_Full_Netflix 全分组 重度用户使用 奈飞全量 (与Github同步)",
value:
"https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_Netflix.ini"
},
{
label: "ACL4SSR 本地 默认版 分组比较全",
value: "config/ACL4SSR.ini"
},
{
label: "ACL4SSR_Mini 本地 精简版",
value: "config/ACL4SSR_Mini.ini"
},
{
label: "ACL4SSR_Mini_NoAuto.ini 本地 精简版+无自动测速",
value: "config/ACL4SSR_Mini_NoAuto.ini"
},
{
label: "ACL4SSR_Mini_Fallback.ini 本地 精简版+fallback",
value: "config/ACL4SSR_Mini_Fallback.ini"
},
{
label: "ACL4SSR_BackCN 本地 回国",
value: "config/ACL4SSR_BackCN.ini"
},
{
label: "ACL4SSR_NoApple 本地 无苹果分流",
value: "config/ACL4SSR_NoApple.ini"
},
{
label: "ACL4SSR_NoAuto 本地 无自动测速 ",
value: "config/ACL4SSR_NoAuto.ini"
},
{
label: "ACL4SSR_NoAuto_NoApple 本地 无自动测速&无苹果分流",
value: "config/ACL4SSR_NoAuto_NoApple.ini"
},
{
label: "ACL4SSR_NoMicrosoft 本地 无微软分流",
value: "config/ACL4SSR_NoMicrosoft.ini"
},
{
label: "ACL4SSR_WithGFW 本地 GFW列表",
value: "config/ACL4SSR_WithGFW.ini"
}
]
},
          {
            label: "universal",
            options: [
              {
                label: "No-Urltest",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/universal/no-urltest.ini"
              },
              {
                label: "Urltest",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/universal/urltest.ini"
              }
            ]
          },
          {
            label: "customized",
            options: [
              {
                label: "Maying",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/customized/maying.ini"
              },
              {
                label: "Ytoo",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/customized/ytoo.ini"
              },
              {
                label: "FlowerCloud",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/customized/flowercloud.ini"
              },
              {
                label: "Nexitally",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/customized/nexitally.ini"
              },
              {
                label: "SoCloud",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/customized/socloud.ini"
              },
              {
                label: "ARK",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/customized/ark.ini"
              },
              {
                label: "ssrCloud",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/customized/ssrcloud.ini"
              }
            ]
          },
          {
            label: "Special",
            options: [
              {
                label: "NeteaseUnblock(仅规则，No-Urltest)",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/special/netease.ini"
              },
              {
                label: "Basic(仅GEOIP CN + Final)",
                value:
                  "https://cdn.jsdelivr.net/gh/SleepyHeeead/subconverter-config@master/remote-config/special/basic.ini"
              }
            ]
          }
        ]
      },
      form: {
        sourceSubUrl: "",
        clientType: "",
        customBackend: "",
        remoteConfig: "",
        excludeRemarks: "",
        includeRemarks: "",
        filename: "",
        emoji: true,
        nodeList: false,
        extraset: false,
        sort: false,
        udp: true,
        tfo: false,
        scv: true,
        expand: true, // 是否将规则全文写进配置文件
        fdn: false,
        appendType: false,
        insert: false, // 是否插入默认订阅的节点，对应配置项 insert_url
        new_name: true, // 是否使用 Clash 新字段

        // tpl 定制功能
        tpl: {
          surge: {
            doh: false // dns 查询是否使用 DoH
          },
          clash: {
            doh: false
          }
        }
      },

      loading: false,
      customSubUrl: "",
      curtomShortSubUrl: "",

      dialogUploadConfigVisible: false,
      loadConfig: "",
      dialogLoadConfigVisible: false,
      uploadConfig: "",
      uploadPassword: "",
      myBot: tgBotLink,
      sampleConfig: remoteConfigSample,

      needUdp: false, // 是否需要添加 udp 参数
    };
  },
  created() {
    document.title = "Elvisの订阅转换";
    this.isPC = this.$getOS().isPc;

    // 获取 url cache
    if (process.env.VUE_APP_USE_STORAGE === 'true') {
      this.form.sourceSubUrl = this.getLocalStorageItem('sourceSubUrl')
    }
  },
  mounted() {
    this.form.clientType = "clash";
    this.form.customBackend = "https://aft.silves.eu.org/sub?";
    this.form.remoteConfig = "https://cdn.staticaly.com/gh/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_AdblockPlus.ini";
    this.notify();
    this.getBackendVersion();
  },
  methods: {
    onCopy() {
      this.$message.success("Copied!");
    },
    goToProject() {
      window.open(project);
    },
    gotoGayhub() {
      window.open(gayhubRelease);
    },
    gotoRemoteConfig() {
      window.open(remoteConfigSample);
    },
    clashInstall() {
      if (this.customSubUrl === "") {
        this.$message.error("请先填写必填项，生成订阅链接");
        return false;
      }

      const url = "clash://install-config?url=";
      window.open(
        url +
        encodeURIComponent(
          this.curtomShortSubUrl !== ""
            ? this.curtomShortSubUrl
            : this.customSubUrl
        )
      );
    },
    surgeInstall() {
      if (this.customSubUrl === "") {
        this.$message.error("请先填写必填项，生成订阅链接");
        return false;
      }

      const url = "surge://install-config?url=";
      window.open(url + this.customSubUrl);
    },
    makeUrl() {
      if (this.form.sourceSubUrl === "" || this.form.clientType === "") {
        this.$message.error("订阅链接与客户端为必填项");
        return false;
      }

      let backend =
        this.form.customBackend === ""
          ? defaultBackend
          : this.form.customBackend;

      let sourceSub = this.form.sourceSubUrl;
      sourceSub = sourceSub.replace(/(\n|\r|\n\r)/g, "|");

      this.customSubUrl =
        backend +
        "target=" +
        this.form.clientType +
        "&url=" +
        encodeURIComponent(sourceSub) +
        "&insert=" +
        this.form.insert;

      if (this.advanced === "2") {
        if (this.form.remoteConfig !== "") {
          this.customSubUrl +=
            "&config=" + encodeURIComponent(this.form.remoteConfig);
        }
        if (this.form.excludeRemarks !== "") {
          this.customSubUrl +=
            "&exclude=" + encodeURIComponent(this.form.excludeRemarks);
        }
        if (this.form.includeRemarks !== "") {
          this.customSubUrl +=
            "&include=" + encodeURIComponent(this.form.includeRemarks);
        }
        if (this.form.filename !== "") {
          this.customSubUrl +=
            "&filename=" + encodeURIComponent(this.form.filename);
        }
        if (this.form.appendType) {
          this.customSubUrl +=
            "&append_type=" + this.form.appendType.toString();
        }

        this.customSubUrl +=
          "&emoji=" +
          this.form.emoji.toString() +
          "&list=" +
          this.form.nodeList.toString() +
          "&tfo=" +
          this.form.tfo.toString() +
          "&scv=" +
          this.form.scv.toString() +
          "&fdn=" +
          this.form.fdn.toString() +
          "&sort=" +
          this.form.sort.toString();

        if (this.needUdp) {
          this.customSubUrl += "&udp=" + this.form.udp.toString()
        }

        if (this.form.tpl.surge.doh === true) {
          this.customSubUrl += "&surge.doh=true";
        }

        if (this.form.clientType === "clash") {
          if (this.form.tpl.clash.doh === true) {
            this.customSubUrl += "&clash.doh=true";
          }

          this.customSubUrl += "&new_name=" + this.form.new_name.toString();
        }
      }

      this.$copyText(this.customSubUrl);
      this.$message.success("定制订阅已复制到剪贴板");
    },
    makeShortUrl() {
      if (this.customSubUrl === "") {
        this.$message.warning("请先生成订阅链接，再获取对应短链接");
        return false;
      }

      this.loading = true;

      let data = new FormData();
      data.append("longUrl", btoa(this.customSubUrl));

      this.$axios
        .post(shortUrlBackend, data, {
          header: {
            "Content-Type": "application/form-data; charset=utf-8"
          }
        })
        .then(res => {
          if (res.data.Code === 1 && res.data.ShortUrl !== "") {
            this.curtomShortSubUrl = res.data.ShortUrl;
            this.$copyText(res.data.ShortUrl);
            this.$message.success("短链接已复制到剪贴板");
          } else {
            this.$message.error("短链接获取失败：" + res.data.Message);
          }
        })
        .catch(() => {
          this.$message.error("短链接获取失败");
        })
        .finally(() => {
          this.loading = false;
        });
    },
    notify() {
      const h = this.$createElement;

      this.$notify({
        title: "Tips",
        type: "warning",
        message: h(
          "i",
          { style: "color: teal" },
          "欢迎━(*｀∀´*)ノ亻!"
        )
      });
    },
    confirmUploadConfig() {
      if (this.uploadConfig === "") {
        this.$message.warning("远程配置不能为空");
        return false;
      }

      this.loading = true;

      let body = {
        content: this.uploadConfig,
      }
      this.$axios.post(configUploadBackend, body).then(res => {
        if (res.data.code === 0 && res.data.data.url !== "") {
          this.$message.success(
            "远程配置上传成功，配置链接已复制到剪贴板，有效期三个月望知悉"
          );

          // 自动填充至『表单-远程配置』
          this.form.remoteConfig = res.data.data.url;
          this.$copyText(this.form.remoteConfig);

          this.dialogUploadConfigVisible = false;
        } else {
          this.$message.error("远程配置上传失败: " + res.data.msg);
        }
      })
        .catch(() => {
          this.$message.error("远程配置上传失败");
        })
        .finally(() => {
          this.loading = false;
        });
    },
    /**
 * Asynchronously analyzes the URL.
 *
 * @return {Promise<string>} The result of the analysis.
 */
    async analyzeUrl() {
      // Check if `loadConfig` includes "target"
      if (this.loadConfig.includes("target")) {
        // If it does, return `loadConfig`
        return this.loadConfig;
      } else {
        // Otherwise, set `loading` to true
        this.loading = true;
        try {
          // Fetch the data from `loadConfig` using GET method and follow redirects
          let response = await fetch(this.loadConfig, {
            method: "GET",
            redirect: "follow",
          });
          // Return the URL from the response
          return response.url;
        } catch (e) {
          // If an error occurs, display an error message with the error details
          this.$message.error(
            "解析短链接失败，请检查短链接服务端是否配置跨域：" + e
          );
        } finally {
          // Set `loading` to false
          this.loading = false;
        }
      }
    },
    /**
     * Confirm and load the configuration.
     *
     * @return {boolean} Returns false if the 'loadConfig' is empty, otherwise returns true.
     */
    confirmLoadConfig() {
      // Check if 'loadConfig' is empty
      if (this.loadConfig.trim() === "") {
        // Display error message if 'loadConfig' is empty
        this.$message.error("订阅链接不能为空");
        return false;
      }

      // Async function to handle the configuration loading
      (async () => {
        try {
          // Analyze the URL and extract its components
          const url = new URL(await this.analyzeUrl());

          // Set the custom backend URL
          this.form.customBackend = url.origin + url.pathname + "?";

          // Parse the URL parameters
          const params = new URLSearchParams(url.search);

          // Get the 'target' parameter
          const target = params.get("target");

          // Set the client type based on the 'target' parameter
          if (target === "surge") {
            const ver = params.get("ver") || "4";
            this.form.clientType = target + "&ver=" + ver;
          } else {
            this.form.clientType = target;
          }

          // Set other form properties based on the URL parameters
          this.form.sourceSubUrl = params.get("url");
          this.form.insert = params.get("insert") === "true";
          this.form.remoteConfig = params.get("config");
          this.form.excludeRemarks = params.get("exclude");
          this.form.includeRemarks = params.get("include");
          this.form.filename = params.get("filename");
          this.form.appendType = params.get("append_type") === "true";
          this.form.emoji = params.get("emoji") === "true";
          this.form.nodeList = params.get("list") === "true";
          this.form.tfo = params.get("tfo") === "true";
          this.form.scv = params.get("scv") === "true";
          this.form.fdn = params.get("fdn") === "true";
          this.form.sort = params.get("sort") === "true";
          this.form.udp = params.get("udp") === "true";
          this.form.tpl.surge.doh = params.get("surge.doh") === "true";
          this.form.tpl.clash.doh = params.get("clash.doh") === "true";
          this.form.new_name = params.get("new_name") === "true";

          // Hide the configuration dialog
          this.dialogLoadConfigVisible = false;

          // Display success message
          this.$message.success("长/短链接已成功解析为订阅信息");
        } catch (error) {
          // Display error message if URL is not valid
          this.$message.error("请输入正确的订阅地址!");
        }
      })();
    },
    backendSearch(queryString, cb) {
      let backends = this.options.backendOptions;

      let results = queryString
        ? backends.filter(this.createFilter(queryString))
        : backends;

      // 调用 callback 返回建议列表的数据
      cb(results);
    },
    createFilter(queryString) {
      return candidate => {
        return (
          candidate.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
        );
      };
    },
    getBackendVersion() {
      this.$axios
        .get(
          defaultBackend.substring(0, defaultBackend.length - 5) + "/version"
        )
        .then(res => {
          this.backendVersion = res.data.replace(/backend\n$/gm, "");
          this.backendVersion = this.backendVersion.replace("subconverter", "");
        });
    },
    saveSubUrl() {
      if (this.form.sourceSubUrl !== '') {
        this.setLocalStorageItem('sourceSubUrl', this.form.sourceSubUrl)
      }
    },
    getLocalStorageItem(itemKey) {
      const now = +new Date()
      let ls = localStorage.getItem(itemKey)

      let itemValue = ''
      if (ls !== null) {
        let data = JSON.parse(ls)
        if (data.expire > now) {
          itemValue = data.value
        } else {
          localStorage.removeItem(itemKey)
        }
      }

      return itemValue
    },
    setLocalStorageItem(itemKey, itemValue) {
      const ttl = process.env.VUE_APP_CACHE_TTL
      const now = +new Date()

      let data = {
        setTime: now,
        ttl: parseInt(ttl),
        expire: now + ttl * 1000,
        value: itemValue
      }
      localStorage.setItem(itemKey, JSON.stringify(data))
    }
  },
};
</script>
