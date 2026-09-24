const STORY_FILES = [
  "./story-v0.4-common-a.md", "./story-v0.4-b.md", "./story-v0.4-c.md",
  "./story-v0.4-d.md", "./story-v0.4-e.md",
];

const ENDINGS = {
  A14P: ["A", "A1 · 被保护的澪"], A14E: ["A", "A2 · 母亲的证词"],
  B16A: ["B", "B1 · 作者早川澪"], B16W: ["B", "B2 · 收工以后"],
  C35M: ["C", "C1 · 莉莉丝版本"], C35Q: ["C", "C2 · 停机之后"],
  D14R: ["D", "D1 · 最后一天"], D14B: ["D", "D2 · 四十七分钟"],
  E10D: ["E", "E1 · 没有观众"], E10P: ["E", "E2 · 共同作者"],
};

const LABELS = {
  A: "家里留下的版本", B: "她演过的每一个人", C: "莉莉丝协议",
  D: "没有摄影机的四十七分钟", E: "关于你的全部",
};

let graphData = { routes: { common: [] }, edges: [] };
let revealTimer = null;
let revealIndex = 0;
let revealLines = [];

const state = {
  current: "C00", visited: [], completed: new Set(), endings: [], variables: {},
  history: [], seconds: 75 * 60, scenes: {},
};

const dom = {
  scene: document.querySelector("#scene"), title: document.querySelector("#sceneTitle"),
  eyebrow: document.querySelector("#sceneEyebrow"), body: document.querySelector("#sceneBody"),
  choices: document.querySelector("#choices"), node: document.querySelector("#nodeIndex"),
  progress: document.querySelector("#progressIndex"), route: document.querySelector("#routeLabel"),
  countdown: document.querySelector("#countdown"), monitor: document.querySelector("#branchMonitor"),
  monitorNode: document.querySelector("#monitorNode"), graph: document.querySelector("#branchGraph"),
  detail: document.querySelector("#monitorDetail"), historyPanel: document.querySelector("#historyPanel"),
  historyList: document.querySelector("#historyList"), historyCount: document.querySelector("#historyCount"),
  exit: document.querySelector("#exitScreen"), reveal: document.querySelector("#revealControl"),
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
  })[character]);
}

function parseStory(markdown) {
  const lines = markdown.split(/\r?\n/);
  const scenes = {};
  let active = null;
  let skippingChoices = false;
  for (const raw of lines) {
    const match = raw.match(/^## ([A-E]\d{2}[A-Z]?)\s+(.+)$/);
    if (match) {
      active = { id: match[1], heading: match[2].trim(), lines: [] };
      scenes[active.id] = active;
      skippingChoices = false;
      continue;
    }
    if (/^# /.test(raw) || (/^## /.test(raw) && !match)) { active = null; skippingChoices = false; continue; }
    if (!active || /^---$/.test(raw)) continue;
    if (/^【选择】/.test(raw)) { skippingChoices = true; continue; }
    if (skippingChoices && /^\s*- /.test(raw)) continue;
    if (skippingChoices && raw.trim() === "") continue;
    if (skippingChoices) skippingChoices = false;
    active.lines.push(raw);
  }
  Object.values(scenes).forEach((scene) => {
    const tokens = scene.heading.split(/\s+/);
    const endIndex = tokens.findIndex((token) => token === "结局");
    const metaCount = ["日", "夜", "晨", "黄昏"].includes(tokens[0]) ? 2 : 0;
    scene.eyebrow = metaCount ? `${tokens[0]} · ${tokens[1]}` : "ARCHIVE NODE";
    scene.title = tokens.slice(metaCount, endIndex > -1 ? endIndex : undefined).join(" ");
    if (endIndex > -1) scene.eyebrow += ` · ${tokens.slice(endIndex).join(" ")}`;
    scene.html = renderLines(scene.lines);
  });
  return scenes;
}

function renderLines(lines) {
  return lines.filter((line) => line.trim() && !/^人物：/.test(line)).map((raw) => {
    const line = raw.trim();
    if (line.startsWith("△")) return `<p class="direction reveal-line" data-kind="direction">${escapeHtml(line.slice(1))}</p>`;
    if (line.startsWith("系统字幕：") || line.startsWith("退出日志：")) return `<p class="system reveal-line" data-kind="system">${escapeHtml(line)}</p>`;
    if (/^【(交互|停顿|显现|覆盖|结局)/.test(line)) return `<p class="note reveal-line" data-kind="cue">${escapeHtml(line)}</p>`;
    if (/^[^：]{1,18}(（[^）]+）)?：/.test(line)) {
      const [speaker, ...rest] = line.split("：");
      return `<p class="reveal-line" data-kind="dialogue"><span class="speaker">${escapeHtml(speaker)}：</span>${escapeHtml(rest.join("："))}</p>`;
    }
    return `<p class="reveal-line" data-kind="text">${escapeHtml(line.replace(/^>\s?/, ""))}</p>`;
  }).join("");
}

function action(label, target, set = null, destination = target) { return { label, target, set, destination }; }

const ACTIONS = {
  C00: [action("停在『意外』声道", "C01", ["FIRST_CAUSE", "accident"]), action("停在『自杀』声道", "C01", ["FIRST_CAUSE", "suicide"]), action("停在『无法确认』声道", "C01", ["FIRST_CAUSE", "unknown"])],
  C01: [action("展开来源到底", "C02", ["SOURCE_DISCIPLINE", "audit"]), action("恢复连续播放", "C02", ["SOURCE_DISCIPLINE", "flow"])],
  C02: [action("截取生成许可", "C03", ["termsCaptured", true]), action("继续直播", "C03", ["termsCaptured", false])],
  C03: [action("接过银行卡", "C04", ["COMMISSION", "paid"]), action("退回银行卡，只抄访问码", "C04", ["COMMISSION", "unpaid"]), action("问：您怕谁看见？", "C04", ["COMMISSION", "asked"])],
  C04: [action("以家庭受托人身份进入", "C05", ["accessMode", "delegated"]), action("以只读身份进入", "C05", ["accessMode", "read"])],
  C05: [action("展开旧案来源", "C06", ["selfAudit", true]), action("遮住旧案报告", "C06", ["selfAudit", false])],
  C06: [action("她在害怕", "C07", ["FIRST_LABEL", "害怕"]), action("她在挑衅", "C07", ["FIRST_LABEL", "挑衅"]), action("她在求救", "C07", ["FIRST_LABEL", "求救"]), action("无法判断", "C07", ["FIRST_LABEL", "无法判断"])],
  C07: [action("先以《风中的恋人》为参照", "C08", ["filmBaseline", "wind"]), action("先以《夜遇》为参照", "C08", ["filmBaseline", "night"])],
  C08: [action("补成『来看』", "C09", ["REPAIR_INSTINCT", "complete"]), action("补成『来找』", "C09", ["REPAIR_INSTINCT", "complete"]), action("补成『来说我』", "C09", ["REPAIR_INSTINCT", "complete"]), action("保留咬带声", "C09", ["REPAIR_INSTINCT", "gap"])],

  A00: [action("选择『雇员』", "A01", ["familyRelation", "employee"]), action("选择『观众』", "A01", ["familyRelation", "viewer"]), action("选择『合作方』", "A01", ["familyRelation", "partner"])],
  A01: [action("进入模拟旧宅", "A02")], A02: [action("先开母亲的门", "A03M", ["familyOrder", "mother"]), action("先开白石的门", "A03H", ["familyOrder", "husband"])],
  A03M: [action("带着修复请求去听白石", "A04H")], A03H: [action("带着白石的拒绝去听母亲", "A04M")], A04H: [action("进入牙科录音", "A05")], A04M: [action("进入牙科录音", "A05")],
  A05: [action("试听并选择一个『妈妈』", "A06R", ["voiceMethod", "repair"]), action("不选声音，展开修复许可", "A06L", ["voiceMethod", "license"])], A06R: [action("查看被涂黑的校历", "A07")], A06L: [action("打开校历", "A07")],
  A07: [action("删除训练索引", "A08P", ["LIVING_PRIVACY", "high"]), action("复制反查链作证", "A08E", ["LIVING_PRIVACY", "low"])], A08P: [action("返回澄子通话", "A09")], A08E: [action("返回澄子通话", "A09")],
  A09: [action("拒绝补全告别", "A10", ["lastMessage", "refused"]), action("试听补全告别", "A10", ["lastMessage", "heard"])], A10: [action("进入家庭声线删除队列", "A11P"), action("进入新闻来源链编辑器", "A11E")], A11P: [action("前往旧宅餐桌", "A12")], A11E: [action("前往旧宅餐桌", "A12")],
  A12: [action("销毁家庭声线模型", "A13P"), action("发布完整毒理与来源链", "A13E")], A13P: [action("按住删除键", "A14P", ["heldDelete", true])], A13E: [action("确认发布", "A14E", ["publishedReport", true])],

  B00: [action("联络佐伯", "B01")], B01: [action("扫描两部片盒", "B02")], B02: [action("先以《风中的恋人》为基线", "B03F", ["workBaseline", "wind"]), action("先以《夜遇》为基线", "B03N", ["workBaseline", "night"])],
  B03F: [action("标作失误", "B04N", ["performanceLabel", "失误"]), action("标作拒绝", "B04N", ["performanceLabel", "拒绝"])], B03N: [action("标作延长表演", "B04F", ["performanceLabel", "表演"]), action("标作真实不适", "B04F", ["performanceLabel", "不适"])], B04F: [action("进入逐帧比对", "B05")], B04N: [action("进入逐帧比对", "B05")], B05: [action("召集两位演员", "B06")],
  B06: [action("神谷更可信", "B07", ["witness", "kamiya"]), action("久野更可信", "B07", ["witness", "kuno"]), action("保留双线", "B07", ["witness", "both"])], B07: [action("播放 LILITH 工作拷贝", "B08A"), action("播放收工带", "B08W")], B08A: [action("打开剪辑指令录音", "B09A")], B08W: [action("恢复覆盖磁道", "B09W")], B09A: [action("进入作者贡献账本", "B10")], B09W: [action("进入作者贡献账本", "B10")],
  B10: [action("澪为唯一作者", "B11", ["authorShare", "mio"]), action("登记集体创作", "B11", ["authorShare", "collective"]), action("拒绝分配比例", "B11", ["authorShare", "unresolved"])], B11: [action("听佐伯的提议", "B12")], B12: [action("倾向登记澪为作者", "B13A"), action("倾向执行停机边界", "B13W")],
  B13A: [action("登记为『遗作』", "B14", ["AUTHORSHIP", "遗作"]), action("登记为『自传』", "B14", ["AUTHORSHIP", "自传"]), action("登记为『互动游戏』", "B14", ["AUTHORSHIP", "互动游戏"])], B13W: [action("撤下全部作者说明", "B14", ["AUTHORSHIP", "未决"])], B14: [action("发布并登记作者", "B15A"), action("执行澪的停机边界", "B15W")], B15A: [action("按下发布", "B16A")], B15W: [action("在『关了吧』之后停止", "B16W")],

  C20: [action("接受管理员权限", "C21", ["adminMode", "write"]), action("只读进入", "C21", ["adminMode", "read"])], C21: [action("保留澪的声线", "C22", ["interfaceVoice", "mio"]), action("切成无性别合成音", "C22", ["interfaceVoice", "neutral"])], C22: [action("逐项展开来源", "C23", ["modelBias", "audit"]), action("保持连续播放", "C23", ["modelBias", "flow"])], C23: [action("进入岸本演示", "C24")],
  C24: [action("继续人格演示", "C25M"), action("当场展开改写日志", "C25Q")], C25M: [action("进入人格合并预览", "C26M")], C25Q: [action("打开同意矩阵", "C26Q")], C26M: [action("允许合并停顿模型", "C27", ["mergedPause", true]), action("撤回停顿模型", "C27", ["mergedPause", false])], C26Q: [action("保留审计包", "C27", ["auditPackage", "kept"]), action("交换模型访问权", "C27", ["auditPackage", "traded"])],
  C27: [action("先问固定事实", "C28", ["questionOrder", "fact"]), action("先问私人问题", "C28", ["questionOrder", "private"]), action("先问不可能的问题", "C28", ["questionOrder", "impossible"])], C28: [action("检查答案来源", "C29")], C29: [action("保持逐词来源覆盖", "C30", ["sourceOverlay", true]), action("关闭覆盖，保留完整声音", "C30", ["sourceOverlay", false])],
  C30: [action("导出模型权重", "C31M"), action("导出来源索引", "C31Q")], C31M: [action("进入上线彩排", "C32M")], C31Q: [action("进入隔离彩排", "C32Q")], C32M: [action("进入双重请求", "C33")], C32Q: [action("进入双重请求", "C33")], C33: [action("允许人格模型上线", "C34M"), action("执行模型隔离", "C34Q")], C34M: [action("确认发布", "C35M")], C34Q: [action("按住隔离开关", "C35Q")],

  D00: [action("返回并查看未归档区", "D01")], D01: [action("先检查电表", "D02E"), action("先检查水表", "D02W")], D02E: [action("比对同型号设备", "D03E")], D02W: [action("运行真实水位模拟", "D03W")], D03E: [action("加入下一条弱证据", "D04")], D03W: [action("加入下一条弱证据", "D04")], D04: [action("访问公寓管理员", "D05")], D05: [action("要求田边逐张辨认", "D06R"), action("记录『无法辨认』", "D06B")], D06R: [action("进入生活痕迹推演", "D07R")], D06B: [action("进入空公寓声景", "D07B")],
  D07R: [action("选择细节并输出重建", "D08R", ["reconstruction", "filled"]), action("全部选择无法判断", "D08R", ["reconstruction", "defaults"])], D07B: [action("留在空声景中", "D08B", ["ABSENCE_TOLERANCE", "high"])], D08R: [action("查看公司邀约", "D09")], D08B: [action("查看公司邀约", "D09")], D09: [action("打开概率清单", "D10")], D10: [action("逐项删除低概率细节", "D11")], D11: [action("接受『情境可推演』", "D12R"), action("标记『不可推演』", "D12B")], D12R: [action("签署情境真实", "D13R")], D12B: [action("放弃完成奖励", "D13B")], D13R: [action("发布《最后一天》", "D14R")], D13B: [action("确认封存", "D14B")],

  E00: [action("查看高村档案", "E01")], E01: [action("查看两个澪", "E02")], E02: [action("进入比较测试", "E03")], E03: [action("选择一个更真", "E04C", ["metaComparison", "chosen"]), action("拒绝比较", "E04R", ["metaComparison", "refused"])], E04C: [action("打开原始树下录像", "E05")], E04R: [action("打开原始树下录像", "E05")], E05: [action("等待录像自然结束", "E06")], E06: [action("查看第二人称审计", "E07")], E07: [action("打开莉莉丝最后权限", "E08")], E08: [action("删除本账号画像", "E09D"), action("公开画像与生成链", "E09P")], E09D: [action("确认删除", "E10D")], E09P: [action("公开生成链", "E10P")],
};

function actionsFor(id) {
  if (id === "C09") {
    const options = [action("触碰澄子的银行卡", "A00", null, "A / FAMILY"), action("触碰缺页通告表", "B00", null, "B / WORK"), action("触碰服务器状态灯", "C20", null, "C / MODEL"), { label: "退出体验", target: "D00", special: "exit", destination: "EXIT → D" }];
    if (state.completed.size >= 2) options.push(action("打开『关于你的全部』", "E00", null, "E / META"));
    return options;
  }
  if (ENDINGS[id]) return [{ label: "记录结局，返回档案大厅", special: "complete", destination: ENDINGS[id][1] }];
  return ACTIONS[id] || [];
}

function routeOf(id) {
  for (const route of ["A", "B", "C", "D", "E"]) if (graphData.routes[route]?.includes(id)) return route;
  return "common";
}

function goTo(id, label = "继续", set = null) {
  if (set) state.variables[set[0]] = set[1];
  state.history.push({ from: state.current, to: id, label });
  if (!state.visited.includes(state.current)) state.visited.push(state.current);
  state.current = id;
  render(true);
}

function revealDelay(line) {
  if (line.dataset.kind === "cue") return 1050;
  if (line.dataset.kind === "direction") return 640;
  return Math.min(1200, Math.max(480, line.textContent.length * 22));
}

function scheduleReveal() {
  clearTimeout(revealTimer);
  if (revealIndex >= revealLines.length) return finishReveal();
  revealTimer = window.setTimeout(revealNext, revealDelay(revealLines[Math.max(0, revealIndex - 1)] || revealLines[0]));
}

function revealNext() {
  clearTimeout(revealTimer);
  if (revealIndex >= revealLines.length) return finishReveal();
  revealLines[revealIndex].classList.add("visible");
  revealIndex += 1;
  if (revealIndex >= revealLines.length) finishReveal(); else scheduleReveal();
}

function finishReveal() {
  clearTimeout(revealTimer);
  revealLines.forEach((line) => line.classList.add("visible"));
  revealIndex = revealLines.length;
  dom.choices.classList.remove("locked");
  dom.reveal.textContent = "本场已展开";
  dom.reveal.disabled = true;
}

function startReveal() {
  clearTimeout(revealTimer);
  revealLines = [...dom.body.querySelectorAll(".reveal-line")];
  revealIndex = 0;
  dom.choices.classList.add("locked");
  dom.reveal.disabled = false;
  dom.reveal.textContent = "全部展开";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !revealLines.length) return finishReveal();
  revealNext();
}

function render(animate = false) {
  const scene = state.scenes[state.current];
  if (!scene) { dom.title.textContent = `节点 ${state.current} 缺失`; dom.body.innerHTML = "<p>剧情数据未能载入。</p>"; return; }
  if (animate) dom.scene.classList.add("leaving");
  window.setTimeout(() => {
    dom.node.textContent = state.current;
    dom.progress.textContent = `${String(new Set([...state.visited, state.current]).size).padStart(3, "0")} / ${String(Object.keys(state.scenes).length).padStart(3, "0")}`;
    dom.eyebrow.textContent = `${scene.eyebrow} · ${state.current}`;
    dom.title.textContent = scene.title;
    dom.body.innerHTML = scene.html || "<p>该节点暂无正文。</p>";
    const route = routeOf(state.current);
    dom.route.textContent = route === "common" ? "未归档会话" : `${route} / ${LABELS[route]}`;
    dom.monitorNode.textContent = `${state.current} · ${route.toUpperCase()}`;
    renderChoices(); renderGraph(); renderHistory(); startReveal();
    dom.scene.classList.remove("leaving");
    window.scrollTo({ top: 0, behavior: animate ? "smooth" : "auto" });
  }, animate ? 190 : 0);
}

function renderChoices() {
  dom.choices.innerHTML = "";
  actionsFor(state.current).forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "choice"; button.dataset.key = String(index + 1).padStart(2, "0");
    button.innerHTML = `${escapeHtml(item.label)}<span class="destination">${escapeHtml(item.destination || "")}</span>`;
    button.addEventListener("click", () => {
      if (dom.choices.classList.contains("locked")) return;
      if (item.special === "exit") { dom.exit.classList.add("open"); dom.exit.setAttribute("aria-hidden", "false"); return; }
      if (item.special === "complete") {
        const [route, ending] = ENDINGS[state.current];
        state.completed.add(route); state.endings.push(ending);
        state.history.push({ from: state.current, to: "C09", label: ending });
        if (!state.visited.includes(state.current)) state.visited.push(state.current);
        state.current = "C09"; render(true); return;
      }
      goTo(item.target, item.label, item.set);
    });
    dom.choices.appendChild(button);
  });
}

function graphLayout() {
  const positions = {};
  graphData.routes.common.forEach((id, i) => { positions[id] = { x: 12 + i * 28, y: 16 }; });
  const columns = { A: 34, B: 102, C: 170, D: 238 };
  for (const route of ["A", "B", "C", "D"]) graphData.routes[route].forEach((id, i) => {
    const suffix = id.match(/[A-Z]$/)?.[0];
    const shift = ["P", "M", "R", "F", "A"].includes(suffix) ? -4 : ["E", "Q", "W", "B", "N", "L", "H"].includes(suffix) ? 4 : 0;
    positions[id] = { x: columns[route] + shift, y: 50 + i * (91 / Math.max(graphData.routes[route].length - 1, 1)) };
  });
  graphData.routes.E.forEach((id, i) => { positions[id] = { x: 43 + i * 15, y: 157 }; });
  return positions;
}

function renderGraph() {
  const NS = "http://www.w3.org/2000/svg";
  const positions = graphLayout();
  const options = actionsFor(state.current).map((item) => item.target).filter(Boolean);
  const traversed = new Set(state.history.map((entry) => `${entry.from}>${entry.to}`));
  dom.graph.innerHTML = "";
  graphData.edges.forEach(([from, to]) => {
    if (!positions[from] || !positions[to]) return;
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", positions[from].x); line.setAttribute("y1", positions[from].y); line.setAttribute("x2", positions[to].x); line.setAttribute("y2", positions[to].y);
    line.setAttribute("class", `graph-edge ${traversed.has(`${from}>${to}`) ? "visited" : ""}`); dom.graph.appendChild(line);
  });
  Object.entries(positions).forEach(([id, point]) => {
    const circle = document.createElementNS(NS, "circle"); const classes = ["graph-node"];
    if (state.visited.includes(id) || state.current === id) classes.push("visited");
    if (options.includes(id)) classes.push("available"); if (state.current === id) classes.push("current");
    if (routeOf(id) === "E" && state.completed.size < 2) circle.style.opacity = "0.15";
    circle.setAttribute("cx", point.x); circle.setAttribute("cy", point.y); circle.setAttribute("r", state.current === id ? "3" : "1.65"); circle.setAttribute("class", classes.join(" "));
    const title = document.createElementNS(NS, "title"); title.textContent = `${id} ${state.scenes[id]?.title || ""}`; circle.appendChild(title); dom.graph.appendChild(circle);
  });
  [["A",34],["B",102],["C",170],["D",238]].forEach(([label,x]) => { const t=document.createElementNS(NS,"text"); t.setAttribute("x",x); t.setAttribute("y",45); t.setAttribute("text-anchor","middle"); t.setAttribute("class","graph-route-label"); t.textContent=label; dom.graph.appendChild(t); });
  if (dom.monitor.classList.contains("expanded")) [state.current, ...options].filter(Boolean).forEach((id) => { const p=positions[id]; if(!p)return; const t=document.createElementNS(NS,"text"); t.setAttribute("x",p.x+3); t.setAttribute("y",p.y-2); t.setAttribute("class","graph-label"); t.textContent=id; dom.graph.appendChild(t); });
  const details = ["A","B","C","D","E"].map((route) => { const locked=route==="E"&&state.completed.size<2; const status=locked?"未解锁":state.completed.has(route)?"已完成":routeOf(state.current)===route?"进行中":"未进入"; return `<div><b>${route} · ${status}</b>${LABELS[route]}</div>`; }).join("");
  const flags=Object.entries(state.variables).map(([k,v])=>`${escapeHtml(k)}=${escapeHtml(v)}`).join(" / ")||"尚无玩家变量";
  dom.detail.innerHTML=`${details}<div class="runtime-state"><b>RUNTIME / ${state.history.length} 次跳转</b>${flags}<br>${state.endings.map(escapeHtml).join(" / ")||"尚无结局"}</div>`;
}

function renderHistory() {
  dom.historyCount.textContent=String(state.history.length).padStart(2,"0");
  dom.historyList.innerHTML=state.history.map((entry)=>`<li><b>${escapeHtml(entry.from)} → ${escapeHtml(entry.to)}</b>${escapeHtml(entry.label)}</li>`).join("");
}

function resetAll(event) {
  event?.preventDefault(); clearTimeout(revealTimer);
  Object.assign(state,{current:"C00",visited:[],completed:new Set(),endings:[],variables:{},history:[],seconds:75*60}); render(true);
}

dom.reveal.addEventListener("click", finishReveal);
dom.body.addEventListener("click", () => { if (revealIndex < revealLines.length) revealNext(); });
document.querySelector("#monitorToggle").addEventListener("click",()=>{const expanded=dom.monitor.classList.toggle("expanded");document.querySelector("#monitorToggle").setAttribute("aria-expanded",String(expanded));renderGraph();});
document.querySelector("#historyToggle").addEventListener("click",()=>{dom.historyPanel.classList.add("open");dom.historyPanel.setAttribute("aria-hidden","false");});
document.querySelector("#historyClose").addEventListener("click",()=>{dom.historyPanel.classList.remove("open");dom.historyPanel.setAttribute("aria-hidden","true");});
document.querySelector("#resetLink").addEventListener("click",resetAll);
document.querySelectorAll("[data-exit-action]").forEach((button)=>button.addEventListener("click",()=>{dom.exit.classList.remove("open");dom.exit.setAttribute("aria-hidden","true");if(button.dataset.exitAction==="log")goTo("D00","重新进入并查看退出日志");}));
document.addEventListener("keydown",(event)=>{if(event.code==="Space"&&revealIndex<revealLines.length){event.preventDefault();revealNext();return;}if(/^[1-9]$/.test(event.key)&&!dom.choices.classList.contains("locked"))[...dom.choices.querySelectorAll(".choice")][Number(event.key)-1]?.click();if(event.key==="Escape"){dom.historyPanel.classList.remove("open");dom.monitor.classList.remove("expanded");renderGraph();}});
window.setInterval(()=>{state.seconds=Math.max(0,state.seconds-1);const m=Math.floor(state.seconds/60),s=state.seconds%60;dom.countdown.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;},1000);

Promise.all([fetch("./story-graph.v0.4.json",{cache:"no-store"}).then((r)=>r.json()),...STORY_FILES.map((file)=>fetch(file,{cache:"no-store"}).then((r)=>r.text()))]).then(([graph,...stories])=>{graphData=graph;state.scenes=parseStory(stories.join("\n"));render();}).catch((error)=>{dom.title.textContent="档案读取失败";dom.body.innerHTML=`<p>${escapeHtml(error.message)}</p>`;});
Object.defineProperty(window,"__MIO_STATE__",{get:()=>({current:state.current,visited:[...state.visited],completed:[...state.completed],endings:[...state.endings],variables:{...state.variables},history:[...state.history]})});
