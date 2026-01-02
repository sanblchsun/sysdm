class ResizablePanels {
  constructor() {
    this.verticalDivider = document.getElementById("verticalDivider");
    this.horizontalDivider = document.getElementById("horizontalDivider");
    this.leftPanel = document.getElementById("leftPanel");
    this.topPanel = document.getElementById("topPanel");
    this.bottomPanel = document.getElementById("bottomPanel");
    this.rightContainer = document.querySelector(".right-container");
    this.container = document.querySelector(".container");

    this.isVerticalResizing = false;
    this.isHorizontalResizing = false;

    // Получаем реальные размеры разделителей из CSS или вычисляем
    this.verticalDividerThickness = 10; // Из CSS: width: 10px
    this.horizontalDividerThickness = 10; // Из CSS: height: 10px

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setInitialSizes();
    this.restoreSizes();
  }

  setInitialSizes() {
    if (!localStorage.getItem("leftPanelWidth")) {
      this.leftPanel.style.width = "30%";
      this.leftPanel.style.flex = "0 0 30%";
    }
    if (!localStorage.getItem("topPanelHeight")) {
      this.topPanel.style.height = "50%";
      this.topPanel.style.flex = "0 0 50%";
    }
  }

  setupEventListeners() {
    this.verticalDivider.addEventListener(
      "mousedown",
      this.startVerticalResize.bind(this)
    );
    this.horizontalDivider.addEventListener(
      "mousedown",
      this.startHorizontalResize.bind(this)
    );

    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseup", this.stopResize.bind(this));

    // Предотвращаем выделение текста
    document.addEventListener("selectstart", (e) => {
      if (this.isVerticalResizing || this.isHorizontalResizing) {
        e.preventDefault();
      }
    });
  }

  startVerticalResize(e) {
    this.isVerticalResizing = true;
    this.startX = e.clientX;
    this.startWidth = this.leftPanel.offsetWidth;

    // Получаем реальные координаты
    const containerRect = this.container.getBoundingClientRect();
    const verticalDividerRect = this.verticalDivider.getBoundingClientRect();

    // Минимальная и максимальная позиция разделителя
    const minLeft = containerRect.left + 10; // 10px padding контейнера
    const maxLeft =
      containerRect.right - 10 - 50 - this.verticalDividerThickness; // padding + минимальная ширина правой части + толщина разделителя

    // Начальная позиция разделителя (центр)
    this.startDividerCenter =
      verticalDividerRect.left + this.verticalDividerThickness / 2;

    // Границы для центра разделителя
    this.minDividerCenter = minLeft + this.verticalDividerThickness / 2;
    this.maxDividerCenter = maxLeft + this.verticalDividerThickness / 2;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }

  startHorizontalResize(e) {
    this.isHorizontalResizing = true;
    this.startY = e.clientY;
    this.startHeight = this.topPanel.offsetHeight;

    // Получаем реальные координаты
    const rightContainerRect = this.rightContainer.getBoundingClientRect();
    const horizontalDividerRect =
      this.horizontalDivider.getBoundingClientRect();

    // Минимальная и максимальная позиция разделителя
    const minTop = rightContainerRect.top; // 10px padding контейнера
    const maxTop =
      rightContainerRect.bottom - 15 - this.horizontalDividerThickness; // padding + минимальная высота нижней панели + толщина разделителя

    // Начальная позиция разделителя (центр)
    this.startDividerCenter =
      horizontalDividerRect.top + this.horizontalDividerThickness / 2;

    // Границы для центра разделителя
    this.minDividerCenter = minTop + this.horizontalDividerThickness / 2;
    this.maxDividerCenter = maxTop + this.horizontalDividerThickness / 2;

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }

  handleMouseMove(e) {
    if (this.isVerticalResizing) {
      this.handleVerticalMove(e.clientX);
    }
    if (this.isHorizontalResizing) {
      this.handleHorizontalMove(e.clientY);
    }
  }

  handleVerticalMove(clientX) {
    const dx = clientX - this.startX;
    let newDividerCenter = this.startDividerCenter + dx;

    // Ограничиваем позицию центра разделителя
    newDividerCenter = Math.max(
      this.minDividerCenter,
      Math.min(newDividerCenter, this.maxDividerCenter)
    );

    // Вычисляем новую ширину левой панели
    const containerRect = this.container.getBoundingClientRect();
    const newWidth =
      newDividerCenter - containerRect.left - this.verticalDividerThickness / 2;

    // Устанавливаем новую ширину
    const actualWidth = Math.max(2, newWidth);
    this.leftPanel.style.width = `${actualWidth}px`;
    this.leftPanel.style.flex = "0 0 auto";

    // Сохраняем ширину
    localStorage.setItem("leftPanelWidth", `${actualWidth}px`);
  }

  handleHorizontalMove(clientY) {
    const dy = clientY - this.startY;
    let newDividerCenter = this.startDividerCenter + dy;

    // Ограничиваем позицию центра разделителя
    newDividerCenter = Math.max(
      this.minDividerCenter,
      Math.min(newDividerCenter, this.maxDividerCenter)
    );

    // Вычисляем новую высоту верхней панели
    const rightContainerRect = this.rightContainer.getBoundingClientRect();
    const newHeight =
      newDividerCenter -
      rightContainerRect.top -
      this.horizontalDividerThickness / 2;

    // Устанавливаем новую высоту
    const actualHeight = Math.max(5, newHeight);
    this.topPanel.style.height = `${actualHeight}px`;
    this.topPanel.style.flex = "0 0 auto";

    // Вычисляем высоту нижней панели
    const totalHeight = rightContainerRect.height;
    const remainingHeight =
      totalHeight - actualHeight - this.horizontalDividerThickness;

    this.bottomPanel.style.height = `${Math.max(5, remainingHeight)}px`;
    this.bottomPanel.style.flex = "1";

    // Сохраняем высоту
    localStorage.setItem("topPanelHeight", `${actualHeight}px`);
  }

  stopResize() {
    this.isVerticalResizing = false;
    this.isHorizontalResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  restoreSizes() {
    const savedWidth = localStorage.getItem("leftPanelWidth");
    const savedHeight = localStorage.getItem("topPanelHeight");

    if (savedWidth) {
      const widthNum = parseInt(savedWidth);
      this.leftPanel.style.width = `${Math.max(2, widthNum)}px`;
      this.leftPanel.style.flex = "0 0 auto";
    }

    if (savedHeight) {
      const heightNum = parseInt(savedHeight);
      const rightContainerRect = this.rightContainer.getBoundingClientRect();

      // Максимальная высота с учетом толщины разделителя
      const maxHeight =
        rightContainerRect.height - 50 - this.horizontalDividerThickness;
      const actualHeight = Math.max(5, Math.min(heightNum, maxHeight));

      this.topPanel.style.height = `${actualHeight}px`;
      this.topPanel.style.flex = "0 0 auto";

      const remainingHeight =
        rightContainerRect.height -
        actualHeight -
        this.horizontalDividerThickness;
      this.bottomPanel.style.height = `${Math.max(5, remainingHeight)}px`;
      this.bottomPanel.style.flex = "1";
    }
  }

  resetLayout() {
    localStorage.removeItem("leftPanelWidth");
    localStorage.removeItem("topPanelHeight");

    this.leftPanel.style.width = "";
    this.leftPanel.style.flex = "";
    this.topPanel.style.height = "";
    this.topPanel.style.flex = "";
    this.bottomPanel.style.height = "";
    this.bottomPanel.style.flex = "";

    setTimeout(() => {
      this.setInitialSizes();
    }, 10);
  }
}

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  const resizable = new ResizablePanels();
  window.resetLayout = () => resizable.resetLayout();

  window.addEventListener("resize", () => {
    setTimeout(() => resizable.restoreSizes(), 50);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadTree();
});

async function loadTree() {
  const treeContainer = document.getElementById("agents-tree");
  if (!treeContainer) {
    console.error("agents-tree not found");
    return;
  }

  treeContainer.innerHTML = "Loading...";

  try {
    const resp = await fetch("/api/v1/tree");
    const data = await resp.json();

    treeContainer.innerHTML = "";
    treeContainer.appendChild(buildTree(data));
  } catch (err) {
    console.error(err);
    treeContainer.innerHTML = "Failed to load agents";
  }
}

function buildTree(companies) {
  const ul = document.createElement("ul");
  ul.classList.add("tree-root");

  companies.forEach((company) => {
    const companyLi = document.createElement("li");
    companyLi.classList.add("tree-company");
    companyLi.textContent = company.name;

    const deptUl = document.createElement("ul");

    company.departments.forEach((dept) => {
      const deptLi = document.createElement("li");
      deptLi.classList.add("tree-department");
      deptLi.textContent = dept.name;

      const agentUl = document.createElement("ul");

      dept.agents.forEach((agent) => {
        const agentLi = document.createElement("li");
        agentLi.classList.add("tree-agent");
        agentLi.textContent = agent.hostname;

        agentLi.classList.add(agent.is_online ? "online" : "offline");

        agentLi.onclick = () => selectAgent(agent);

        agentUl.appendChild(agentLi);
      });

      deptLi.appendChild(agentUl);
      deptUl.appendChild(deptLi);
    });

    companyLi.appendChild(deptUl);
    ul.appendChild(companyLi);
  });

  return ul;
}

function selectAgent(agent) {
  const details = document.getElementById("agent-details");
  if (!details) return;

  details.innerHTML = `
        <h3>${agent.hostname}</h3>
        <p>Status: <b>${agent.is_online ? "Online" : "Offline"}</b></p>
        <p>ID: ${agent.id}</p>
    `;
}
