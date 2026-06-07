import {
  QUEST_STATUS,
  buildQuestLogView,
  getClaimedQuestRewardIds
} from "../gameplay/quests/index.js";

const EMPTY_TITLE = "No quest selected";
const EMPTY_DESCRIPTION = "No Hearthmere quest details are available.";
const EMPTY_OBJECTIVE_TEXT = "No objectives recorded.";
const EMPTY_REWARD_TEXT = "No rewards recorded.";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value ?? {}, key);
}

function readClaimedRewardInput(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (hasOwn(payload, "claimedRewardIds")) return payload.claimedRewardIds;
  if (hasOwn(payload, "claimedQuestRewardIds")) return payload.claimedQuestRewardIds;
  if (hasOwn(payload, "claimedIds")) return payload.claimedIds;
  if (hasOwn(payload, "questRewardSnapshot")) return payload.questRewardSnapshot;
  if (hasOwn(payload, "rewardSnapshot")) return payload.rewardSnapshot;

  return null;
}

function normalizeClaimedRewardIds(payload) {
  const input = readClaimedRewardInput(payload);
  return input === null ? null : getClaimedQuestRewardIds(input);
}

function resolveQuestIndex(questViews, selection) {
  const views = Array.isArray(questViews) ? questViews : [];
  const maxIndex = views.length - 1;

  if (Number.isInteger(selection) && selection >= 0 && selection <= maxIndex) {
    return selection;
  }

  const questId = normalizeText(selection);
  if (!questId) {
    return -1;
  }

  return views.findIndex((quest) => quest.questId === questId);
}

export function resolveQuestLogSelection(questViews, requestedSelection = null, fallbackSelection = null) {
  const views = Array.isArray(questViews) ? questViews : [];
  const requestedIndex = resolveQuestIndex(views, requestedSelection);
  if (requestedIndex >= 0) {
    return requestedIndex;
  }

  const fallbackIndex = resolveQuestIndex(views, fallbackSelection);
  if (fallbackIndex >= 0) {
    return fallbackIndex;
  }

  if (views.length === 0) {
    return 0;
  }

  const firstActive = views.findIndex((quest) => quest.status === QUEST_STATUS.ACTIVE);
  if (firstActive >= 0) {
    return firstActive;
  }

  const firstCompleted = views.findIndex((quest) => quest.status === QUEST_STATUS.COMPLETED);
  return firstCompleted >= 0 ? firstCompleted : 0;
}

export function buildQuestLogDetailView(questView) {
  if (!questView) {
    return Object.freeze({
      questId: "",
      title: EMPTY_TITLE,
      state: "Unavailable",
      regionTitle: "Hearthmere",
      text: EMPTY_DESCRIPTION,
      progressText: "0/0 objectives",
      objectives: Object.freeze([]),
      rewardLabel: EMPTY_REWARD_TEXT,
      rewards: Object.freeze([])
    });
  }

  const reward = questView.reward;

  return Object.freeze({
    questId: questView.questId,
    title: questView.title,
    state: questView.state,
    regionTitle: questView.regionTitle,
    text: questView.text,
    progressText: questView.progressText,
    objectives: questView.objectives,
    rewardLabel: reward?.label ?? EMPTY_REWARD_TEXT,
    rewards: reward?.rewards ?? Object.freeze([])
  });
}

export class QuestLogUI {
  constructor(bus, options = {}) {
    if (!bus || typeof bus.on !== "function" || typeof bus.emit !== "function") {
      throw new TypeError("QuestLogUI: bus with on() and emit() is required");
    }

    const documentRef = options.document ?? (typeof document !== "undefined" ? document : null);
    if (!documentRef) {
      throw new Error("QuestLogUI: document is required");
    }

    this.bus = bus;
    this.document = documentRef;
    this.unsubs = [];
    this.domCleanups = [];
    this.isOpen = false;
    this.claimedRewardIds = normalizeClaimedRewardIds(options) ?? Object.freeze([]);
    this.questLogView = options.view ?? buildQuestLogView(options.questLog, {
      claimedRewardIds: this.claimedRewardIds
    });
    this.selectedIndex = resolveQuestLogSelection(
      this.questLogView.quests,
      options.selectedQuestId ?? options.selectedIndex
    );
    this.mount = options.mount ?? this.document.getElementById("app") ?? this.document.body;

    if (!this.mount) {
      throw new Error("QuestLogUI: mount element is required");
    }

    this.root = this.createDOM();
    this.mount.appendChild(this.root);

    this.list = this.requireWithin(this.root, "[data-questlog-list]");
    this.activeCount = this.requireWithin(this.root, "[data-questlog-active]");
    this.completedCount = this.requireWithin(this.root, "[data-questlog-completed]");
    this.totalCount = this.requireWithin(this.root, "[data-questlog-total]");
    this.selectionSummary = this.requireWithin(this.root, "[data-questlog-selected]");
    this.detailKicker = this.requireWithin(this.root, "[data-questlog-detail-kicker]");
    this.detailTitle = this.requireWithin(this.root, "[data-questlog-detail-title]");
    this.detailStatus = this.requireWithin(this.root, "[data-questlog-detail-status]");
    this.detailText = this.requireWithin(this.root, "[data-questlog-detail-text]");
    this.detailProgress = this.requireWithin(this.root, "[data-questlog-detail-progress]");
    this.detailObjectives = this.requireWithin(this.root, "[data-questlog-objectives]");
    this.detailRewardLabel = this.requireWithin(this.root, "[data-questlog-reward-label]");
    this.detailRewards = this.requireWithin(this.root, "[data-questlog-rewards]");
    this.closeButton = this.requireWithin(this.root, "[data-questlog-close]");

    this.bindDOM();
    this.bindUIBus();
    this.render();
  }

  get isVisible() {
    return this.isOpen;
  }

  open(payload = {}) {
    const viewPayload = this.readQuestLogPayload(payload);
    const selection = this.readSelectionPayload(payload);
    const hasExplicitSelection = selection !== null;

    if (viewPayload) {
      this.setQuestLog(viewPayload, {
        selectedSelection: selection,
        preserveSelection: !hasExplicitSelection
      });
    } else if (hasExplicitSelection) {
      this.selectQuest(selection, { emit: false });
    }

    this.isOpen = true;
    this.root.classList.add("menu-open");
    this.root.setAttribute("aria-hidden", "false");
    this.bus.emit("questlog:opened", this.buildSelectionPayload());
    this.findSelectedButton()?.focus();
  }

  close({ emit = true } = {}) {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.root.classList.remove("menu-open");
    this.root.setAttribute("aria-hidden", "true");

    if (emit) {
      this.bus.emit("questlog:closed", this.buildSelectionPayload());
    }
  }

  toggle(payload = {}) {
    if (this.isOpen) {
      this.close();
      return;
    }

    this.open(payload);
  }

  setQuestLog(payload, { selectedSelection = null, preserveSelection = true } = {}) {
    const currentQuestId = preserveSelection ? this.getSelectedQuest()?.questId : null;
    const claimedRewardIds = normalizeClaimedRewardIds(payload);
    if (claimedRewardIds) {
      this.claimedRewardIds = claimedRewardIds;
    }

    const nextView = payload?.quests && payload?.summary
      ? payload
      : buildQuestLogView(payload?.questLog ?? payload?.log ?? payload, {
        claimedRewardIds: this.claimedRewardIds
      });

    this.questLogView = nextView;
    this.selectedIndex = resolveQuestLogSelection(
      this.questLogView.quests,
      selectedSelection,
      currentQuestId
    );
    this.render();
  }

  selectQuest(selection, { emit = true } = {}) {
    const nextIndex = resolveQuestLogSelection(
      this.questLogView.quests,
      selection,
      this.getSelectedQuest()?.questId ?? this.selectedIndex
    );
    const selectionChanged = nextIndex !== this.selectedIndex;

    this.selectedIndex = nextIndex;
    this.render();

    if (emit && selectionChanged) {
      this.bus.emit("questlog:select", this.buildSelectionPayload());
    }
  }

  dispose() {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs.length = 0;

    for (const cleanup of this.domCleanups) {
      cleanup();
    }
    this.domCleanups.length = 0;

    this.root.remove();
  }

  getSelectedQuest() {
    return this.questLogView.quests[this.selectedIndex] ?? null;
  }

  buildSelectionPayload() {
    const quest = this.getSelectedQuest();

    return {
      selectedIndex: this.selectedIndex,
      questId: quest?.questId ?? "",
      quest
    };
  }

  readQuestLogPayload(payload) {
    if (!payload) {
      return null;
    }

    if (payload.quests && payload.summary) {
      return payload;
    }

    if (payload.questLog || payload.log) {
      return payload;
    }

    if (payload.version && payload.quests) {
      return payload;
    }

    return null;
  }

  readSelectionPayload(payload) {
    if (Number.isInteger(payload)) {
      return payload;
    }

    const directQuestId = normalizeText(payload);
    if (directQuestId) {
      return directQuestId;
    }

    const selectedQuestId = normalizeText(payload?.selectedQuestId);
    if (selectedQuestId) {
      return selectedQuestId;
    }

    const questId = normalizeText(payload?.questId);
    if (questId) {
      return questId;
    }

    return Number.isInteger(payload?.selectedIndex) ? payload.selectedIndex : null;
  }

  requireWithin(root, selector) {
    const element = root.querySelector(selector);
    if (!element) {
      throw new Error(`QuestLogUI: missing element "${selector}"`);
    }

    return element;
  }

  bindDOM() {
    const onBackdropClick = (event) => {
      if (event.target === this.root) {
        this.close();
      }
    };
    const onCloseClick = () => {
      this.close();
    };
    const onListClick = (event) => {
      const button = event.target.closest("[data-quest-index]");
      if (!button) {
        return;
      }

      const questIndex = Number.parseInt(button.dataset.questIndex ?? "", 10);
      if (Number.isInteger(questIndex)) {
        this.selectQuest(questIndex);
      }
    };

    this.root.addEventListener("click", onBackdropClick);
    this.closeButton.addEventListener("click", onCloseClick);
    this.list.addEventListener("click", onListClick);

    this.domCleanups.push(() => {
      this.root.removeEventListener("click", onBackdropClick);
      this.closeButton.removeEventListener("click", onCloseClick);
      this.list.removeEventListener("click", onListClick);
    });
  }

  bindUIBus() {
    this.unsubs.push(
      this.bus.on("questlog:open", (payload) => {
        this.open(payload ?? {});
      }),
      this.bus.on("questlog:close", () => {
        this.close();
      }),
      this.bus.on("questlog:toggle", (payload) => {
        this.toggle(payload ?? {});
      }),
      this.bus.on("questlog:set", (payload) => {
        const viewPayload = this.readQuestLogPayload(payload);
        if (!viewPayload) {
          return;
        }

        const selection = this.readSelectionPayload(payload);
        this.setQuestLog(viewPayload, {
          selectedSelection: selection,
          preserveSelection: selection === null
        });
      }),
      this.bus.on("quest:changed", (payload) => {
        const viewPayload = this.readQuestLogPayload(payload);
        if (!viewPayload) {
          return;
        }

        this.setQuestLog(viewPayload, { preserveSelection: true });
      }),
      this.bus.on("questlog:select", (payload) => {
        const selection = this.readSelectionPayload(payload);
        if (selection === null) {
          return;
        }

        this.selectQuest(selection, { emit: false });
      })
    );
  }

  render() {
    this.renderSummary();
    this.renderList();
    this.renderDetail();
  }

  renderSummary() {
    const summary = this.questLogView.summary;
    this.activeCount.textContent = String(summary.activeCount);
    this.completedCount.textContent = String(summary.completedCount);
    this.totalCount.textContent = String(summary.totalCount);

    if (this.questLogView.quests.length === 0) {
      this.selectionSummary.textContent = "No quests";
      return;
    }

    this.selectionSummary.textContent = `Selected ${String(this.selectedIndex + 1).padStart(2, "0")}/${String(this.questLogView.quests.length).padStart(2, "0")}`;
  }

  renderList() {
    this.list.replaceChildren();

    const groups = [
      ["Active", this.questLogView.active],
      ["Completed", this.questLogView.completed],
      ["Inactive", this.questLogView.inactive]
    ];

    for (const [label, quests] of groups) {
      const section = this.document.createElement("section");
      const heading = this.document.createElement("div");
      const title = this.document.createElement("span");
      const count = this.document.createElement("span");

      section.className = "questlog-group";
      heading.className = "questlog-group__heading";
      title.className = "questlog-group__title";
      title.textContent = label;
      count.className = "questlog-group__count";
      count.textContent = String(quests.length);
      heading.append(title, count);
      section.appendChild(heading);

      if (quests.length === 0) {
        const empty = this.document.createElement("p");
        empty.className = "questlog-list__empty";
        empty.textContent = `No ${label.toLowerCase()} quests.`;
        section.appendChild(empty);
        this.list.appendChild(section);
        continue;
      }

      for (const quest of quests) {
        const questIndex = this.questLogView.quests.findIndex((entry) => entry.questId === quest.questId);
        section.appendChild(this.buildQuestButton(quest, questIndex));
      }

      this.list.appendChild(section);
    }
  }

  buildQuestButton(quest, questIndex) {
    const button = this.document.createElement("button");
    const titleRow = this.document.createElement("span");
    const title = this.document.createElement("span");
    const badge = this.document.createElement("span");
    const summary = this.document.createElement("span");
    const progress = this.document.createElement("span");
    const isSelected = questIndex === this.selectedIndex;

    button.type = "button";
    button.className = "questlog-entry";
    button.dataset.questIndex = String(questIndex);
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(isSelected));
    button.setAttribute("aria-label", `${quest.title}. ${quest.state}. ${quest.progressText}.`);
    button.title = quest.title;
    button.classList.toggle("is-selected", isSelected);
    button.dataset.status = quest.status;

    titleRow.className = "questlog-entry__title-row";
    title.className = "questlog-entry__title";
    title.textContent = quest.title;
    badge.className = "questlog-entry__badge";
    badge.textContent = quest.state;
    titleRow.append(title, badge);

    summary.className = "questlog-entry__summary";
    summary.textContent = quest.summary;
    progress.className = "questlog-entry__progress";
    progress.textContent = quest.progressText;

    button.append(titleRow, summary, progress);
    return button;
  }

  renderDetail() {
    const detail = buildQuestLogDetailView(this.getSelectedQuest());

    this.detailKicker.textContent = detail.regionTitle;
    this.detailTitle.textContent = detail.title;
    this.detailStatus.textContent = detail.state;
    this.detailText.textContent = detail.text;
    this.detailProgress.textContent = detail.progressText;
    this.detailRewardLabel.textContent = detail.rewardLabel;
    this.renderObjectives(detail.objectives);
    this.renderRewards(detail.rewards);
  }

  renderObjectives(objectives) {
    this.detailObjectives.replaceChildren();

    if (objectives.length === 0) {
      const empty = this.document.createElement("li");
      empty.className = "questlog-objectives__empty";
      empty.textContent = EMPTY_OBJECTIVE_TEXT;
      this.detailObjectives.appendChild(empty);
      return;
    }

    for (const objective of objectives) {
      const item = this.document.createElement("li");
      const label = this.document.createElement("span");
      const count = this.document.createElement("span");
      const state = this.document.createElement("span");

      item.className = "questlog-objective";
      item.dataset.complete = String(objective.complete);
      label.className = "questlog-objective__label";
      label.textContent = objective.label;
      count.className = "questlog-objective__count";
      count.textContent = objective.progressText;
      state.className = "questlog-objective__state";
      state.textContent = objective.complete ? "Done" : "Open";

      item.append(label, count, state);
      this.detailObjectives.appendChild(item);
    }
  }

  renderRewards(rewards) {
    this.detailRewards.replaceChildren();

    if (rewards.length === 0) {
      const empty = this.document.createElement("li");
      empty.className = "questlog-rewards__empty";
      empty.textContent = EMPTY_REWARD_TEXT;
      this.detailRewards.appendChild(empty);
      return;
    }

    for (const reward of rewards) {
      const item = this.document.createElement("li");
      const label = this.document.createElement("span");
      const count = this.document.createElement("span");

      item.className = "questlog-reward";
      label.className = "questlog-reward__label";
      label.textContent = reward.label;
      count.className = "questlog-reward__count";
      count.textContent = reward.countText;

      item.append(label, count);
      this.detailRewards.appendChild(item);
    }
  }

  findSelectedButton() {
    return this.root.querySelector(`[data-quest-index="${this.selectedIndex}"]`);
  }

  createDOM() {
    const root = this.document.createElement("section");
    root.id = "questlog-ui";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Quest log");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="rf-panel questlog-shell">
        <div class="questlog-header">
          <div class="questlog-heading">
            <p class="questlog-kicker">Field Journal</p>
            <h2 class="rf-title questlog-title">Quest Ledger</h2>
          </div>
          <div class="questlog-summary" aria-label="Quest summary">
            <div class="questlog-summary__group">
              <span class="questlog-summary__label">Active</span>
              <span class="questlog-summary__value" data-questlog-active>0</span>
            </div>
            <div class="questlog-summary__group">
              <span class="questlog-summary__label">Done</span>
              <span class="questlog-summary__value" data-questlog-completed>0</span>
            </div>
            <div class="questlog-summary__group">
              <span class="questlog-summary__label">Total</span>
              <span class="questlog-summary__value" data-questlog-total>0</span>
            </div>
          </div>
          <button type="button" class="questlog-close" data-questlog-close>Back</button>
        </div>

        <div class="questlog-layout">
          <section class="questlog-list-pane" aria-label="Quest entries">
            <div class="questlog-list__heading">
              <span class="questlog-list__title">Quests</span>
              <span class="questlog-list__selected" data-questlog-selected>No quests</span>
            </div>
            <div class="questlog-list" role="listbox" data-questlog-list></div>
          </section>

          <aside class="questlog-detail-pane" aria-live="polite">
            <div class="questlog-detail__kicker" data-questlog-detail-kicker>Hearthmere</div>
            <div class="questlog-detail__title-row">
              <h3 class="questlog-detail__title" data-questlog-detail-title>${EMPTY_TITLE}</h3>
              <span class="questlog-detail__status" data-questlog-detail-status>Unavailable</span>
            </div>
            <p class="questlog-detail__text" data-questlog-detail-text>${EMPTY_DESCRIPTION}</p>

            <section class="questlog-objectives">
              <div class="questlog-objectives__heading">
                <span class="questlog-objectives__title">Objectives</span>
                <span class="questlog-objectives__summary" data-questlog-detail-progress>0/0 objectives</span>
              </div>
              <ul class="questlog-objectives__list" data-questlog-objectives>
                <li class="questlog-objectives__empty">${EMPTY_OBJECTIVE_TEXT}</li>
              </ul>
            </section>

            <section class="questlog-rewards">
              <div class="questlog-rewards__heading">
                <span class="questlog-rewards__title">Rewards</span>
                <span class="questlog-rewards__summary" data-questlog-reward-label>${EMPTY_REWARD_TEXT}</span>
              </div>
              <ul class="questlog-rewards__list" data-questlog-rewards>
                <li class="questlog-rewards__empty">${EMPTY_REWARD_TEXT}</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    `;

    return root;
  }
}
