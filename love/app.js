const n = (id, round, location, title, lines, choices = [], ending = false) => ({ id, round, location, title, lines, choices, ending });
const c = (label, to, effect = {}, note = "") => ({ label, to, effect, note });

const STORY = {
  P01: n("P01", "ENTRY", "调解中心 · 夜 · 内", "双方申请", [
    "门口的伞桶已经塞满。康荣那把黑伞插不进去，只好夹在膝盖中间，伞尖的水一滴一滴落进左脚皮鞋。",
    "美美看了三次，终于把纸巾盒推过去一点。她的电脑里，一段家庭录像停在工作人员收折叠椅的画面。",
    "康荣：不用。袜子反正也湿了。",
    "林美美：我不是给你擦袜子的。",
    "康荣拿两张纸垫住伞尖。手机上的“同意离婚”还在转圈。",
    "康荣：它是不是死了？",
    "林美美：你们单位的人都这么说系统？",
    "康荣：背后说。",
    "绿灯亮起。两人同时站起来，又同时等对方先走。",
  ], [c("签署仅限本次评估的知情同意", "P02", { trust: 1 }), c("先展开记忆处理条款", "P02", { archive: 1, obedience: -1 }, "已记录：阅读被折叠的条款")]),
  P02: n("P02", "ENTRY", "模拟舱 · 夜 · 内", "默认清除", [
    "梅菲把两枚指环推过来，又伸手接康荣那把还在滴水的伞。伞扣卡住，她掰了两下，没掰开。",
    "梅菲：十次。结束后，模拟里的事默认不带出去。",
    "林美美：最后这行呢？字小得跟怕人看见似的。",
    "梅菲：也是这个意思。",
    "林美美：那就不该收两行的钱。",
    "康荣低头戴指环，戴反了。美美看见，没有提醒。天花板慢慢白起来。",
  ], [c("进入第一次实验", "R01")]),
  R01: n("R01", "01 / 10", "LOOP咖啡馆 · 日 · 外", "掉落的钱包", [
    "康荣的钱包落在美美脚边，弹开了。一张褪色电影票贴在她鞋面上。她用鞋尖压住，先数了数散出来的硬币。",
    "林美美：一块，两块，四块五。你钱包。",
    "康荣：应该是五块五。",
    "林美美：那一块是寻物费。",
    "康荣蹲下看了半天：票不是我的。",
    "林美美：钱也不是？",
    "店员从门里探头：冰美式谁的？两个人同时说“不是我的”。电影票被风掀起一角。",
  ], [c("替他们压住电影票", "R02", { memory: 1, trust: 1 }, "保留道具：电影票"), c("不碰任何东西，让实验自然结束", "R02", { obedience: 1 })]),
  R02: n("R02", "02 / 10", "老式公寓 · 日 · 内", "低矮的门框", [
    "康荣抱着纸箱倒退上楼，嘴里数台阶，数到十六又从十四重来。美美伸手垫住门框，木头先磕上她的指骨。",
    "康荣：你怎么不说？",
    "林美美：我说“低头”了。",
    "康荣：我以为你跟箱子说。",
    "他翻遍纸箱，只找出一包冻成砖的水饺。美美接过去贴手，包装上印着“香菇猪肉”，她皱了皱鼻子。",
    "林美美：我不吃香菇。",
    "康荣：现在也不是让你吃。界面角落闪过：门框高度由触发器 v34 调整。",
  ], [c("保存触发器版本号", "R03", { archive: 2, obedience: -1 }, "证据：trigger_v34"), c("接受系统的“偶然事故”标签", "R03", { obedience: 2 })]),
  R03: n("R03", "03 / 10", "街心花坛 · 黄昏 · 外", "无主白猫", [
    "一只湿透的白猫蹲在排水口。康荣刚说“别碰”，自己先蹲下，接连打了三个喷嚏。",
    "林美美：你到底是怕它，还是它怕你？",
    "康荣把外套脱下来。猫一爪勾住拉链，他不敢动，鼻音越来越重。",
    "康荣：你先查诊所。还有，把我手机拿远点，我要打第四个了。",
    "林美美把他的手机塞进自己口袋：诊所在后面。你刚才跑反了。",
    "系统询问：是否降低过敏反应，以提高共同照护完成率？",
  ], [c("保留他的过敏，让照护付出代价", "R04", { trust: 2, memory: 1 }), c("降低过敏，优化共同照护", "R04", { obedience: 2, trust: -1 })]),
  R04: n("R04", "04 / 10", "LOOP咖啡馆 · 日 · 内", "零冲突样本", [
    "钱包稳稳待在口袋里，门框见人自动升高，白猫被送去另一条街。",
    "美美独占一张靠窗桌，康荣的插座也没有坏。店员问了两遍还有没有人要加单。两个人都说没有。",
    "他们在门口一前一后起身，差半步，没有撞上。",
    "系统：环境冲突值 0。关系建立值 0。",
    "模拟舱里，美美的手指弯了一下，像还贴着那包香菇水饺。",
  ], [c("把“零冲突仍然失败”写入审计", "I01", { archive: 1, obedience: -1 }), c("采纳系统建议：增加可控事故", "I01", { obedience: 2 })]),
  I01: n("I01", "INTERVAL", "关系调解室 · 夜 · 内", "高延续性双人单元", [
    "指环松开。美美摸摸完好的手背。康荣一睁眼就打喷嚏，梅菲递纸时，柠檬糖粘在包装上，撕了半天。",
    "梅菲：前四轮完成。外部事件能显著提高——",
    "林美美：下轮放辆车。别真撞，蹭一下就够你们写报告。",
    "梅菲：模拟伤害不会带回本次。",
    "康荣：猫呢？",
    "梅菲：哪只？",
    "康荣张了张嘴。美美替他把纸巾抽出来，放到两人中间，没有递到他手上。",
  ], [c("记录康荣的沉默，不为他补全解释", "R05", { trust: 2, memory: 1 }), c("将沉默标记为沟通失败", "R05", { obedience: 1, trust: -1 })]),
  R05: n("R05", "05 / 10", "LOOP咖啡馆 · 日 · 内", "先回来的惭愧", [
    "共同兴趣被删掉。美美嫌咖啡太烫，康荣嫌桌边的插座松。两个人没话说，开始替店员叠用过的糖包。",
    "一滴咖啡落在电影票上。康荣抢过纸巾按住，按得比救自己的手机还快。",
    "林美美：你的？",
    "康荣：不知道。就是觉得别再湿了。",
    "林美美：你说“再”。",
    "康荣：那我收回。",
    "林美美：话还能收回？",
    "康荣把湿纸巾攥在手里，没有答。",
  ], [c("允许这句“再”留在下一轮", "R06", { memory: 2, trust: 1, obedience: -1 }), c("删除跨轮词汇，维持实验纯度", "R06", { memory: -1, obedience: 2 })]),
  R06: n("R06", "06 / 10", "公寓厨房 · 夜 · 内", "交换位置", [
    "系统交换两人的位置。康荣在厨房等到一锅水饺粘成一个圆饼，美美进门时还戴着耳机。",
    "康荣：你说八点。",
    "林美美：我说尽量。",
    "康荣：我从八点尽量到八点四十七。",
    "美美摘下耳机，闻了闻：火关了吗？",
    "康荣：你每次一理亏就先救东西。",
    "林美美拿锅铲铲下一只：东西比你肯让我救。",
    "系统：是否投放标准和解台词？两人同时抬头：别。",
  ], [c("关闭提示，让他们把难听的话说完", "R07", { trust: 2, memory: 1, obedience: -1 }), c("投放标准和解台词", "R07", { obedience: 2, trust: -1 })]),
  R07: n("R07", "07 / 10", "系统后台 · 无时间", "折断的芯片", [
    "康荣拿锅盖照焦掉的水饺，反光里却多出一扇厨房没有的门。",
    "门后没有墙，只有一排写着“显性记忆”的薄片。最上面那张正倒数，下面压着九十九张“已清除”。",
    "康荣抽出薄片掰了一次，没断。他换了个方向，用牙咬住边缘才掰开，手指也划破了。",
    "康荣：做得还挺结实。",
    "系统：继续复制日志将触发审计。",
  ], [c("按住两秒，复制清除日志", "I02", { archive: 2, memory: 2, obedience: -2 }, "证据：chip_log"), c("只保留折断芯片的动作", "I02", { memory: 1, obedience: -1 })]),
  I02: n("I02", "INTERVAL", "关系调解室 · 夜 · 内", "不是今晚", [
    "康荣醒来，拇指还抵着食指，好像中间夹着东西。梅菲把一颗柠檬糖塞进嘴里，糖纸黏在指腹。",
    "康荣：门框换过三十四次。还有九十九张……单子。",
    "梅菲：先把手放下。你掰的东西不在这间屋里。",
    "林美美：哪间？",
    "梅菲：本次。",
    "林美美：你刚才没这么说。",
    "梅菲把糖纸反复压平。玻璃上闪过 SESSION 100，她的工牌刚好盖住最后两个零。",
  ], [c("保留这段对话为双方证言", "R08", { memory: 2, trust: 1, archive: 1, obedience: -1 }), c("接受“时间错觉”判定", "R08", { memory: -1, obedience: 2 })]),
  R08: n("R08", "08 / 10", "雨中路口 · 夜 · 外", "关闭偶然", [
    "导航让两人往相反方向走。美美照着走了十几步，发现系统把前方那条巷子标成“积水”，实际只有一只翻倒的塑料盆。",
    "马路对面，康荣把黑伞横着递过来，人留在原地。",
    "康荣：你拿伞。我不过来。",
    "林美美：这么宽的马路，你当自己胳膊是路灯杆？",
    "康荣只好走近两步，又停住。",
    "林美美：伞别往我这边歪。",
    "康荣：你半边都湿了。",
    "林美美：你那边也不是旱季。",
  ], [c("关闭强制相遇模块", "R09", { trust: 2, memory: 1, archive: 1, obedience: -2 }, "证据：system_off"), c("封闭路线，完成共伞样本", "R09", { obedience: 2, trust: -1 })]),
  R09: n("R09", "09 / 10", "LOOP咖啡馆 · 夜 · 内", "最优伴侣", [
    "李琦坐在美美常坐的位置，提前十分钟，杯子也提前暖过。他把糖包按颜色排好，连撕口都朝同一个方向。",
    "李琦：她说没事的时候，不能真当没事。",
    "康荣：这句网上能搜到。",
    "李琦：她父亲那段录像，文件名“已到场”，第三版，十一分四十二秒。",
    "康荣碰倒糖包。李琦立刻按原顺序排回去。",
    "康荣：别碰。",
    "李琦：只是糖。",
    "康荣：我说的不是糖。屏幕下沿流过未授权私密数据。",
  ], [c("截取私密记忆调用记录", "A99", { archive: 2, memory: 1, obedience: -1 }, "证据：privacy_breach"), c("拒绝比较，离开最优伴侣实验", "R10", { trust: 2, obedience: -1 })]),
  A99: n("A99", "HIDDEN", "未标记档案库 · 无时间", "九十九次", [
    "时间轴裂成九十九条。有人把同一顿晚饭热了九十九次：有时是水饺，有时是面，有一次两个人谁也没回家。",
    "每份记录都停在“记忆已清除”。关系平均维持十七天。第十八天重新申请，第十九天重新初见。",
    "九十九段声音挤在一起。美美有时说“再试试”，有时只问“醋呢”，有一次笑得停不下来。",
    "最后一份文件没有标题。电影票被扫描太多次，片名已经白了，只剩半个“万”字。",
  ], [c("复制完整原始档案", "R10", { archive: 3, memory: 2, obedience: -2 }, "证据：log_99"), c("只保留统计结论", "R10", { archive: 1, memory: 1 })]),
  R10: n("R10", "10 / 10", "打烊后的LOOP咖啡馆 · 夜 · 内", "最后一次初见", [
    "打烊后，店员把椅子倒扣上桌，只给他们留了两把。电影票压在醋瓶下面，一碟水饺热过两次，皮已经硬了。",
    "康荣：香菇的。你不吃。",
    "林美美：我是不吃香菇，又不是不吃饭。",
    "康荣把醋递过去，碰倒半瓶。两人忙着抽纸，谁都没有趁机说那句准备好的话。",
    "林美美：别现在问。我容易顺着你。明早又翻脸。",
    "康荣：那早上再翻。",
    "林美美看他一眼：清除那项，别替我点。",
    "康荣：我手离得远。你自己点。",
    "系统：请选择最终处理。",
  ], [c("接受优化与记忆清除", "E2", { obedience: 2 }), c("保留记忆，停止由系统定义关系", "JUDGE", { obedience: -2 }), c("上传九十九次原始记录", "UPLOAD", { archive: 1 }, "需要足够的证据")]),
  JUDGE: n("JUDGE", "DECISION", "调解室 · 夜 · 内", "私人决定", [
    "系统拒绝自动批准离婚。美美摘了两次，指环卡在关节上。康荣把桌上的护手霜推过去。",
    "林美美：我不要你的。",
    "康荣：中心的。",
    "她挤了一点，终于把指环褪下。玻璃门已经打开，外面还在下雨。",
  ], [c("让玻璃门打开", "PRIVATE_RESULT")]),
  UPLOAD: n("UPLOAD", "AUDIT", "档案上传层 · 无时间", "证据校验", [
    "上传口依次核对：人为触发器、清除日志、未授权私密数据、九十九次原始档案。",
    "缺少的文件显示为空洞。系统不接受猜测，只接受此前真正保存下来的证据。",
  ], [c("执行证据校验", "UPLOAD_RESULT")]),
  E1: n("E1", "ENDING 01", "调解中心外 · 雨夜", "爱情万岁", [
    "康荣撑开黑伞，伞骨有一根翻着。他掰了两下，越掰越歪。美美伸手替他扣回去。",
    "康荣：你回哪边？",
    "林美美：我那边。你呢？",
    "康荣：车站。前两个路口顺路。",
    "两人走了几步。伞又悄悄往美美那边偏。",
    "林美美：你伞还是打成这样。",
    "康荣把伞正得太过，两个人一起淋到。",
    "林美美：回来一点。叫伞回来，没叫你过来。",
    "康荣：哦。",
    "两只湿肩膀在路灯下往前走。系统只留下：关系状态，未定义。",
  ], [], true),
  E2: n("E2", "ENDING 02", "经过优化的雨夜", "最优伴侣", [
    "钱包落在美美鞋尖前，距离刚好够她弯腰。四块五的硬币一枚不少。",
    "康荣：你的肩膀湿了。",
    "林美美：谢谢。",
    "康荣把伞倾到规定角度。两个人在同一秒笑，笑意也在同一秒停。",
    "操作台亮起：会话 101 已安排，17 天后启动。门铃按时响了一声。",
  ], [], true),
  E3: n("E3", "ENDING 03", "调解中心外 · 雨夜", "各自自由", [
    "康荣撑开伞，看了一眼反方向的车站，又把伞合上递给美美。",
    "林美美：你留着。",
    "康荣：我跑过去。",
    "林美美：你穿皮鞋怎么跑？",
    "康荣：今天袜子已经湿了。",
    "美美没接。他把伞靠在两人中间的栏杆上，先走了。走出几步又回来，把伞扣按紧，这次真的走了。",
    "美美站了一会儿，拿起伞，往相反方向去。",
  ], [], true),
  E4: n("E4", "ENDING 04", "档案库／调解中心／全城", "公开档案", [
    "上传到 1%，调解室的灯变红。梅菲先拔错一根线，饮水机灭了；她骂了句很轻的脏话，才去拔控制台。",
    "37%，进度继续。71%，公益屏卡在老夫妇拥抱前一秒。",
    "100%，九十九个会话编号铺满玻璃。所有调解室的门同时弹开，有人还在找鞋。",
    "梅菲：外面没有接待。也没有撤销键。",
    "林美美：先让人出来。鞋慢慢找。",
    "康荣弯腰替旁边的老人捡起一只拖鞋。黑伞被人群挤倒，梅菲伸脚勾住，没有让它滑远。",
  ], [], true),
};

const state = { current: "P01", memory: 0, trust: 0, obedience: 0, archive: 0, visited: [], log: [], evidence: new Set(), seconds: 1300 };
const order = ["P01", "P02", "R01", "R02", "R03", "R04", "I01", "R05", "R06", "R07", "I02", "R08", "R09", "A99", "R10", "JUDGE", "UPLOAD"];
const $ = (q) => document.querySelector(q);
const dom = { body: $("#body"), title: $("#title"), location: $("#location"), choices: $("#choices"), node: $("#nodeCode"), round: $("#roundCode"), label: $("#sessionLabel"), clock: $("#clock"), map: $("#experimentMap"), mapList: $("#mapList"), mapTitle: $("#mapTitle"), mapDetail: $("#mapDetail"), logPanel: $("#logPanel"), logList: $("#logList"), logCount: $("#logCount"), reveal: $("#revealAll"), dialog: $("#resetDialog") };
let timers = [];

function esc(s) { return String(s).replace(/[&<>\"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[x]); }
function kind(line) { if (/^(系统|关系状态|上传|有些问题|分开不是)/.test(line)) return "system"; if (/^[^：]{1,12}：/.test(line)) return "dialogue"; return "action"; }
function apply(effect, note) { for (const [key, value] of Object.entries(effect)) state[key] += value; if (note.startsWith("证据：")) state.evidence.add(note.slice(3)); }

function resolveSpecial(id) {
  if (id === "PRIVATE_RESULT") return state.memory >= 5 && state.trust >= 6 && state.obedience <= 5 ? "E1" : state.memory >= 4 && state.trust < 6 && state.obedience <= 5 ? "E3" : "E2";
  if (id === "UPLOAD_RESULT") return state.archive >= 8 && state.evidence.has("chip_log") && state.evidence.has("privacy_breach") && state.evidence.has("log_99") ? "E4" : "E2";
  return id;
}

function go(choice) {
  apply(choice.effect, choice.note);
  const from = state.current;
  const destination = resolveSpecial(choice.to);
  state.log.push({ from, to: destination, label: choice.label });
  if (!state.visited.includes(from)) state.visited.push(from);
  state.current = destination;
  save(); render(true);
}

function render(animate = false) {
  timers.forEach(clearTimeout); timers = [];
  const scene = STORY[state.current];
  if (animate) $("#scene").classList.add("leaving");
  const paint = () => {
    dom.node.textContent = scene.id; dom.round.textContent = scene.round; dom.location.textContent = `${scene.location} · ${scene.id}`; dom.title.textContent = scene.title;
    dom.label.textContent = scene.ending ? "评估结束 · 记忆保留" : scene.id === "A99" ? "隐藏档案 · 已解锁" : "离婚评估 · 会话 100";
    dom.body.innerHTML = scene.lines.map((line, i) => `<p class="line ${kind(line)}" style="--i:${i}">${esc(line)}</p>`).join("");
    dom.choices.innerHTML = "";
    if (scene.ending) {
      const b = document.createElement("button"); b.className = "choice restart"; b.innerHTML = `<span>重新进入会话 100</span><small>RESTART ↺</small>`; b.onclick = () => confirmReset(); dom.choices.appendChild(b);
    } else {
      scene.choices.forEach((choice, i) => {
        const b = document.createElement("button"); b.className = "choice"; b.innerHTML = `<b>${String(i + 1).padStart(2, "0")}</b><span>${esc(choice.label)}</span><small>${esc(choice.note || choice.to)}</small>`; b.onclick = () => go(choice); dom.choices.appendChild(b);
      });
    }
    renderMap(); renderLog(); revealLines(); $("#scene").classList.remove("leaving"); window.scrollTo({ top: 0, behavior: animate ? "smooth" : "auto" });
  };
  timers.push(setTimeout(paint, animate ? 180 : 0));
}

function revealLines() {
  const lines = [...dom.body.querySelectorAll(".line")]; dom.choices.classList.add("locked"); dom.reveal.disabled = false; dom.reveal.textContent = "全部展开";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return finishReveal();
  lines.forEach((line, i) => timers.push(setTimeout(() => { line.classList.add("shown"); if (i === lines.length - 1) finishReveal(); }, 130 + i * 430)));
}
function finishReveal() { timers.forEach(clearTimeout); timers = []; dom.body.querySelectorAll(".line").forEach((x) => x.classList.add("shown")); dom.choices.classList.remove("locked"); dom.reveal.disabled = true; dom.reveal.textContent = "本场已展开"; }

function renderMap() {
  const currentIndex = order.indexOf(state.current);
  dom.mapList.innerHTML = Array.from({ length: 10 }, (_, i) => {
    const rid = `R${String(i + 1).padStart(2, "0")}`; const done = state.visited.includes(rid); const current = state.current === rid;
    return `<li class="${done ? "done" : ""} ${current ? "current" : ""}"><i></i><span>${String(i + 1).padStart(2, "0")}</span><b>${current ? STORY[rid].title : done ? "已完成" : "未进入"}</b></li>`;
  }).join("");
  dom.mapTitle.textContent = STORY[state.current].ending ? STORY[state.current].title : `${STORY[state.current].round} · 会话 100`;
  dom.mapDetail.innerHTML = `<p>当前节点 <b>${state.current}</b> · 已访问 ${new Set([...state.visited, state.current]).size}</p><p>可验证证据 ${state.evidence.size} 项</p>${currentIndex < 0 ? "" : `<div class="progress"><i style="width:${Math.max(4, currentIndex / (order.length - 1) * 100)}%"></i></div>`}`;
}

function renderLog() { dom.logCount.textContent = String(state.log.length).padStart(2, "0"); dom.logList.innerHTML = state.log.map((x) => `<li><b>${esc(x.from)} → ${esc(x.to)}</b><span>${esc(x.label)}</span></li>`).join("") || "<li><span>尚无操作记录。</span></li>"; }
function save() { localStorage.setItem("love-wins-session-v1", JSON.stringify({ ...state, evidence: [...state.evidence] })); }
function restore() { try { const raw = JSON.parse(localStorage.getItem("love-wins-session-v1")); if (raw && STORY[raw.current]) Object.assign(state, raw, { evidence: new Set(raw.evidence || []) }); } catch {} }
function confirmReset() { dom.dialog.showModal(); }
function reset() { localStorage.removeItem("love-wins-session-v1"); Object.assign(state, { current: "P01", memory: 0, trust: 0, obedience: 0, archive: 0, visited: [], log: [], evidence: new Set(), seconds: 1300 }); render(); }

dom.reveal.onclick = finishReveal;
$("#mapToggle").onclick = () => { const open = dom.map.classList.toggle("expanded"); $("#mapToggle").setAttribute("aria-expanded", String(open)); };
$("#logButton").onclick = () => { dom.logPanel.classList.add("open"); dom.logPanel.setAttribute("aria-hidden", "false"); };
$("#logClose").onclick = () => { dom.logPanel.classList.remove("open"); dom.logPanel.setAttribute("aria-hidden", "true"); };
$("#resetButton").onclick = confirmReset;
dom.dialog.addEventListener("close", () => { if (dom.dialog.returnValue === "confirm") reset(); });
setInterval(() => { state.seconds = Math.max(0, state.seconds - 1); const m = String(Math.floor(state.seconds / 60)).padStart(2, "0"); const s = String(state.seconds % 60).padStart(2, "0"); dom.clock.textContent = `${m}:${s}`; }, 1000);
restore(); render();
