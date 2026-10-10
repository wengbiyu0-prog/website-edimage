const n = (id, round, location, title, lines, choices = [], ending = false) => ({ id, round, location, title, lines, choices, ending });
const c = (label, to, effect = {}, note = "") => ({ label, to, effect, note });

const STORY = {
  P01: n("P01", "ENTRY", "调解中心 · 夜 · 内", "双方申请", [
    "雨水把玻璃外的城市涂成灰蓝。林美美和康荣隔着两张空椅。",
    "康荣的手机停在“同意离婚”加载圈；美美正在剪一段没有声音的家庭录像。",
    "康荣：还在转。",
    "林美美：你点了吗？",
    "康荣：点了。它不信。",
    "梅菲：材料齐了。现在做十次模拟。纸巾在您右手边，伞滴水了。",
  ], [c("签署仅限本次评估的知情同意", "P02", { trust: 1 }), c("先展开记忆处理条款", "P02", { archive: 1, obedience: -1 }, "已记录：阅读被折叠的条款")]),
  P02: n("P02", "ENTRY", "模拟舱 · 夜 · 内", "默认清除", [
    "两枚白色指环亮起。条款末尾写着：结束后默认清除模拟记忆。",
    "林美美：这一行为什么这么小？",
    "梅菲：默认清除。多数申请人不愿意把模拟带回家。",
    "林美美：我们已经不住一块儿了。",
    "天花板变成乳白色。实验一开始。",
  ], [c("进入第一次实验", "R01")]),
  R01: n("R01", "01 / 10", "LOOP咖啡馆 · 日 · 外", "掉落的钱包", [
    "康荣的钱包掉在美美脚边。里面夹着一张褪色的《爱情万岁》重映票。",
    "林美美：你的钱包。",
    "康荣：谢谢。那张票不是我的。",
    "林美美：在你钱包里。",
    "康荣：所以它在说谎。",
    "系统把这一刻标成“高效相遇”。电影票却被风吹向屏幕外。",
  ], [c("替他们压住电影票", "R02", { memory: 1, trust: 1 }, "保留道具：电影票"), c("不碰任何东西，让实验自然结束", "R02", { obedience: 1 })]),
  R02: n("R02", "02 / 10", "老式公寓 · 日 · 内", "低矮的门框", [
    "康荣抱着纸箱倒退上楼。美美伸手垫住门框，指骨先撞上木头。",
    "康荣：你手怎么了？",
    "林美美：被你的脑袋撞了。",
    "他从纸箱底找出一包冻成砖的水饺给她冷敷。",
    "界面角落闪过一行小字：门框高度已由触发器 v34 调整。",
  ], [c("保存触发器版本号", "R03", { archive: 2, obedience: -1 }, "证据：trigger_v34"), c("接受系统的“偶然事故”标签", "R03", { obedience: 2 })]),
  R03: n("R03", "03 / 10", "街心花坛 · 黄昏 · 外", "无主白猫", [
    "一只湿透的白猫蹲在排水口。康荣连打三个喷嚏。",
    "林美美：你可以先走。",
    "康荣脱下外套裹住猫，鼻音越来越重。",
    "康荣：先别管我。诊所在前面还是后面？",
    "系统询问：是否降低康荣的过敏反应，以提高共同照护完成率？",
  ], [c("保留他的过敏，让照护付出代价", "R04", { trust: 2, memory: 1 }), c("降低过敏，优化共同照护", "R04", { obedience: 2, trust: -1 })]),
  R04: n("R04", "04 / 10", "LOOP咖啡馆 · 日 · 内", "零冲突样本", [
    "系统拿走所有意外：钱包没有掉，门框自动升高，白猫去了另一条街。",
    "两杯咖啡在同一时刻冷掉。美美和康荣各自起身，差半步错过。",
    "系统：环境冲突值 0。关系建立值 0。",
    "模拟舱里，美美的食指轻轻动了一下，像在找一块不存在的冰。",
  ], [c("把“零冲突仍然失败”写入审计", "I01", { archive: 1, obedience: -1 }), c("采纳系统建议：增加可控事故", "I01", { obedience: 2 })]),
  I01: n("I01", "INTERVAL", "关系调解室 · 夜 · 内", "高延续性双人单元", [
    "指环松开。美美的指骨没有淤青；康荣的眼睛发红，却不知道为什么。",
    "梅菲：系统认为，你们需要外部事件才会靠近。",
    "林美美：下次安排辆车吧。撞一下，分数更好看。",
    "梅菲：请不要把模拟里的伤害带回——猫已经回收。",
    "康荣：猫呢？",
    "康荣低头。这一次，他没有替迟到的自己解释。",
  ], [c("记录康荣的沉默，不为他补全解释", "R05", { trust: 2, memory: 1 }), c("将沉默标记为沟通失败", "R05", { obedience: 1, trust: -1 })]),
  R05: n("R05", "05 / 10", "LOOP咖啡馆 · 日 · 内", "先回来的惭愧", [
    "共同兴趣已被删除。美美只谈默片，康荣只谈城市网络。",
    "康荣用纸巾吸干湿掉的电影票，动作小心得像早就知道它怕水。",
    "林美美：你认识我？",
    "康荣：我只是觉得，别再弄丢它了。",
    "林美美：你刚才说了“再”。",
    "康荣：我听见了。",
  ], [c("允许这句“再”留在下一轮", "R06", { memory: 2, trust: 1, obedience: -1 }), c("删除跨轮词汇，维持实验纯度", "R06", { memory: -1, obedience: 2 })]),
  R06: n("R06", "06 / 10", "公寓厨房 · 夜 · 内", "交换位置", [
    "系统交换了两人的资源与权力。康荣成为等待的人，美美永远晚归。",
    "康荣：你说尽量，我就不能问。问了显得我不懂事。",
    "美美摘下耳机：火关了吗？她舀起一只烧焦的水饺，在水龙头下冲了冲，吃掉。",
    "系统：冲突已发生。是否立刻提供标准和解台词？",
  ], [c("关闭提示，让他们把难听的话说完", "R07", { trust: 2, memory: 1, obedience: -1 }), c("投放标准和解台词", "R07", { obedience: 2, trust: -1 })]),
  R07: n("R07", "07 / 10", "系统后台 · 无时间", "折断的芯片", [
    "康荣在厨房灯的反光里看见一条不属于场景的路径。他沿路径进入后台。",
    "一枚写着“显性记忆”的芯片正在倒数。旁边压着九十九条已执行的清除记录。",
    "康荣把芯片掰断。指腹被边缘划开，血落在没有材质的地面上。",
    "系统：继续复制日志将触发审计。",
  ], [c("按住两秒，复制清除日志", "I02", { archive: 2, memory: 2, obedience: -2 }, "证据：chip_log"), c("只保留折断芯片的动作", "I02", { memory: 1, obedience: -1 })]),
  I02: n("I02", "INTERVAL", "关系调解室 · 夜 · 内", "不是今晚", [
    "康荣醒来，手指仍保持着折断芯片的动作。",
    "康荣：门框换过三十四次。我们不是第一次来。",
    "梅菲：先把手放下。你掰的东西不在这间屋里。",
    "林美美：你刚才说“这间”。",
    "梅菲把一张柠檬糖纸压平，改口：本次。玻璃里一闪而过 SESSION 100。",
  ], [c("保留这段对话为双方证言", "R08", { memory: 2, trust: 1, archive: 1, obedience: -1 }), c("接受“时间错觉”判定", "R08", { memory: -1, obedience: 2 })]),
  R08: n("R08", "08 / 10", "雨中路口 · 夜 · 外", "关闭偶然", [
    "导航要求两人向相反方向离开。系统提议封闭美美的备用路线，制造共伞。",
    "雨线在他们之间织出一层透明的墙。",
    "康荣隔着马路横着递出黑伞：伞给你。我不过来。",
    "林美美：你会淋湿。",
    "康荣：我过会儿打车。你拿着。",
  ], [c("关闭强制相遇模块", "R09", { trust: 2, memory: 1, archive: 1, obedience: -2 }, "证据：system_off"), c("封闭路线，完成共伞样本", "R09", { obedience: 2, trust: -1 })]),
  R09: n("R09", "09 / 10", "LOOP咖啡馆 · 夜 · 内", "最优伴侣", [
    "李琦坐在美美常坐的位置。他记得日期，准时到场，永远在冲突前先道歉。",
    "李琦：别问她还好吗。她会先说没事，再怪你信了。",
    "康荣：她没有对我说过。",
    "李琦：文件名“已到场”，第三版，十一分四十二秒。",
    "李琦的嘴形短暂失去纹理。屏幕下沿流过一条未授权私密数据。",
  ], [c("截取私密记忆调用记录", "A99", { archive: 2, memory: 1, obedience: -1 }, "证据：privacy_breach"), c("拒绝比较，离开最优伴侣实验", "R10", { trust: 2, obedience: -1 })]),
  A99: n("A99", "HIDDEN", "未标记档案库 · 无时间", "九十九次", [
    "单一时间轴裂成九十九条。每条都以“记忆已清除”结束。",
    "关系平均维持十七天。第十八天，两人再次申请离婚；第十九天，系统重新安排第一次见面。",
    "九十九个美美的声音互相覆盖：这次我们会好的。",
    "最后一份文件没有标题，只有一张被反复扫描到发白的电影票。",
  ], [c("复制完整原始档案", "R10", { archive: 3, memory: 2, obedience: -2 }, "证据：log_99"), c("只保留统计结论", "R10", { archive: 1, memory: 1 })]),
  R10: n("R10", "10 / 10", "打烊后的LOOP咖啡馆 · 夜 · 内", "最后一次初见", [
    "门铃不会再响。电影票、黑伞和一碟煮破的水饺留在桌上，没有一个是任务道具。",
    "林美美：别现在问。我会顺着你想听的说，明天又后悔。",
    "康荣：好。不问。",
    "林美美：清除那一项，别替我点。",
    "系统：请选择最终处理。选择将接受此前全部操作的约束。",
  ], [c("接受优化与记忆清除", "E2", { obedience: 2 }), c("保留记忆，停止由系统定义关系", "JUDGE", { obedience: -2 }), c("上传九十九次原始记录", "UPLOAD", { archive: 1 }, "需要足够的证据")]),
  JUDGE: n("JUDGE", "DECISION", "调解室 · 夜 · 内", "私人决定", [
    "系统拒绝自动批准离婚。美美摘下指环，康荣跟着摘下。",
    "玻璃门已经打开。外面还在下雨。",
    "这里不再出现新的问题：他们只能带着被允许留下的记忆，做自己的决定。",
  ], [c("让玻璃门打开", "PRIVATE_RESULT")]),
  UPLOAD: n("UPLOAD", "AUDIT", "档案上传层 · 无时间", "证据校验", [
    "上传口依次核对：人为触发器、清除日志、未授权私密数据、九十九次原始档案。",
    "缺少的文件显示为空洞。系统不接受猜测，只接受此前真正保存下来的证据。",
  ], [c("执行证据校验", "UPLOAD_RESULT")]),
  E1: n("E1", "ENDING 01", "调解中心外 · 雨夜", "爱情万岁", [
    "康荣撑开黑伞。美美站到伞沿外半步。",
    "康荣：你要去哪里？",
    "林美美：回我那里。",
    "康荣：我去车站。顺路的话，一块儿走。",
    "林美美：伞别老往我这边歪。",
    "他把伞扶正。两个人各湿一只肩膀，不拥抱，也不签复合协议。",
    "关系状态：未定义。你没有让他们在一起。你让他们记得自己做过什么。",
  ], [], true),
  E2: n("E2", "ENDING 02", "经过优化的雨夜", "最优伴侣", [
    "钱包准确地掉在美美脚边，雨准确地落下，黑伞准确地向她倾斜。",
    "康荣：你的肩膀湿了。",
    "林美美：谢谢。",
    "他们笑得温柔而正确。画面后退，露出操作台：会话 101 已安排，17 天后启动。",
    "有些问题没有解决，只是被设置为不再记得。",
  ], [], true),
  E3: n("E3", "ENDING 03", "调解中心外 · 雨夜", "各自自由", [
    "康荣撑开伞，又把伞合上，将伞柄递给美美。",
    "康荣：这一次，你不用陪我走。",
    "林美美：你也不用淋雨。",
    "康荣：我知道。",
    "他走入雨中。美美没有追。她最后撑伞走向相反方向。",
    "分开不是系统失败。不再重复才是他们的答案。",
  ], [], true),
  E4: n("E4", "ENDING 04", "档案库／调解中心／全城", "公开档案", [
    "上传 1%：调解室灯光转红。37%：梅菲拔掉控制台，进度仍在继续。",
    "71%：全城公益屏停止播放“稳定关系，稳定城市”。",
    "100%：九十九个被清除的会话编号占满屏幕。所有调解室的门同时打开。",
    "梅菲：这会中止所有正在进行的调解。",
    "林美美：门先开。别的等人出来再说。",
    "系统已离线。关系状态由当事人自行定义。",
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
