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

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setInitialSizes();
    this.restoreSizes();
  }

  setInitialSizes() {
    // Устанавливаем начальные размеры только если они не сохранены
    if (!localStorage.getItem("leftPanelWidth")) {
      this.leftPanel.style.width = "30%";
    }
    if (!localStorage.getItem("topPanelHeight")) {
      // Начальная высота 50%
      this.topPanel.style.height = "50%";
      this.topPanel.style.flex = "none";
    }
  }

  setupEventListeners() {
    // Вертикальный разделитель
    this.verticalDivider.addEventListener(
      "mousedown",
      this.startVerticalResize.bind(this)
    );

    // Горизонтальный разделитель - ФИКСИРУЕМ
    this.horizontalDivider.addEventListener(
      "mousedown",
      this.startHorizontalResize.bind(this)
    );

    // Обработчики для мыши
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseup", this.stopResize.bind(this));

    // Для мобильных устройств
    this.verticalDivider.addEventListener("touchstart", (e) => {
      this.startVerticalResize(e.touches[0]);
      document.addEventListener("touchmove", this.handleTouchMove.bind(this));
      document.addEventListener("touchend", this.stopResize.bind(this));
      e.preventDefault();
    });

    this.horizontalDivider.addEventListener("touchstart", (e) => {
      this.startHorizontalResize(e.touches[0]);
      document.addEventListener("touchmove", this.handleTouchMove.bind(this));
      document.addEventListener("touchend", this.stopResize.bind(this));
      e.preventDefault();
    });
  }

  startVerticalResize(e) {
    this.isVerticalResizing = true;
    this.startX = e.clientX;
    this.startWidth = this.leftPanel.offsetWidth;
    this.containerWidth = this.container.offsetWidth;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }

  startHorizontalResize(e) {
    this.isHorizontalResizing = true;
    this.startY = e.clientY;
    this.startHeight = this.topPanel.offsetHeight;
    this.containerHeight = this.rightContainer.offsetHeight;

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

  handleTouchMove(e) {
    if (this.isVerticalResizing && e.touches[0]) {
      this.handleVerticalMove(e.touches[0].clientX);
    }
    if (this.isHorizontalResizing && e.touches[0]) {
      this.handleHorizontalMove(e.touches[0].clientY);
    }
    e.preventDefault();
  }

  handleVerticalMove(clientX) {
    const dx = clientX - this.startX;
    const minWidth = 1;
    const maxWidth = this.containerWidth - 50;
    let newWidth = this.startWidth + dx;

    // Ограничиваем размеры
    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));

    // Применяем новые размеры
    this.leftPanel.style.width = `${newWidth}px`;
    this.leftPanel.style.flex = "none";

    // Сохраняем в localStorage
    localStorage.setItem("leftPanelWidth", `${newWidth}px`);
  }

  handleHorizontalMove(clientY) {
    const dy = clientY - this.startY;
    const minHeight = 0;
    const maxHeight = this.containerHeight - 30;
    let newHeight = this.startHeight + dy;

    // Ограничиваем размеры
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    // Применяем новые размеры
    this.topPanel.style.height = `${newHeight}px`;
    this.topPanel.style.flex = "none";
    this.bottomPanel.style.flex = "1";

    // Сохраняем в localStorage
    localStorage.setItem("topPanelHeight", `${newHeight}px`);
  }

  stopResize() {
    this.isVerticalResizing = false;
    this.isHorizontalResizing = false;

    // Восстанавливаем курсор и выделение
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  restoreSizes() {
    const savedWidth = localStorage.getItem("leftPanelWidth");
    const savedHeight = localStorage.getItem("topPanelHeight");

    if (savedWidth) {
      this.leftPanel.style.width = savedWidth;
      this.leftPanel.style.flex = "none";
    }

    if (savedHeight) {
      this.topPanel.style.height = savedHeight;
      this.topPanel.style.flex = "none";
      this.bottomPanel.style.flex = "1";
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  new ResizablePanels();

  // Добавляем функцию для сброса (для отладки)
  window.resetLayout = function () {
    localStorage.removeItem("leftPanelWidth");
    localStorage.removeItem("topPanelHeight");
    location.reload();
  };
});
