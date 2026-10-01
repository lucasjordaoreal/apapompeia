const APA_CONFIG = {
  pixCode: "",
  recipientName: "APA de Pompeia",
  documents: [],
  contact: "",
  socialLinks: []
};

const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const animalCards = [...document.querySelectorAll(".animal-card")];
const galleryEmpty = document.querySelector("#gallery-empty");
const animalDialog = document.querySelector("#animal-dialog");

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menu");
  siteNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
  siteNav.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeMenu();
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((filterButton) => {
      const isSelected = filterButton === button;
      filterButton.classList.toggle("is-active", isSelected);
      filterButton.setAttribute("aria-pressed", String(isSelected));
    });

    let visibleCount = 0;
    animalCards.forEach((card) => {
      const isVisible = selectedFilter === "all" || card.dataset.kind === selectedFilter;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });
    galleryEmpty.hidden = visibleCount > 0;
  });
});

animalCards.forEach((card) => {
  card.addEventListener("click", () => {
    const image = document.querySelector("#dialog-image");
    image.src = card.dataset.image;
    image.alt = `${card.dataset.title}, fotografia ilustrativa`;
    document.querySelector("#dialog-title").textContent = card.dataset.title;
    animalDialog.showModal();
  });
});

document.querySelector(".dialog-close").addEventListener("click", () => animalDialog.close());
animalDialog.addEventListener("click", (event) => {
  if (event.target === animalDialog) animalDialog.close();
});

document.querySelectorAll(".amount-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".amount-button").forEach((amountButton) => {
      const isSelected = amountButton === button;
      amountButton.classList.toggle("is-selected", isSelected);
      amountButton.setAttribute("aria-pressed", String(isSelected));
    });
  });
});

function crc16(payload) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function hasValidPixCrc(code) {
  const normalizedCode = code.replace(/\s+/g, "");
  const checksumPosition = normalizedCode.lastIndexOf("6304");
  if (!normalizedCode.startsWith("000201") || checksumPosition < 0 || checksumPosition + 8 !== normalizedCode.length) return false;
  const payload = normalizedCode.slice(0, checksumPosition + 4);
  const checksum = normalizedCode.slice(checksumPosition + 4);
  return crc16(payload) === checksum;
}

function setupPix() {
  const code = APA_CONFIG.pixCode.trim();
  const isValid = code.length > 0 && hasValidPixCrc(code);
  const qrPlaceholder = document.querySelector("#qr-placeholder");
  const pixCodeDisplay = document.querySelector("#pix-code-display");
  const copyButton = document.querySelector("#copy-pix");
  const qrContainer = document.querySelector("#pix-qr");
  const qrInstruction = document.querySelector("#qr-instruction");

  if (!code) return;
  if (!isValid) {
    qrPlaceholder.querySelector("strong").textContent = "Código Pix não validado";
    qrPlaceholder.querySelector("small").textContent = "Confira o código oficial e o dígito verificador antes de publicar.";
    pixCodeDisplay.textContent = "Código Pix aguardando validação";
    return;
  }

  pixCodeDisplay.textContent = code;
  copyButton.disabled = false;
  qrPlaceholder.querySelector("strong").textContent = "QR Code indisponível";
  qrPlaceholder.querySelector("small").textContent = "Não foi possível carregar o gerador de QR Code.";
  qrInstruction.textContent = `Confira se o destinatário aparece como ${APA_CONFIG.recipientName}.`;

  if (window.QRCode) {
    qrContainer.style.display = "block";
    qrPlaceholder.hidden = true;
    new QRCode(qrContainer, { text: code.replace(/\s+/g, ""), width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
  }
}

document.querySelector("#copy-pix").addEventListener("click", async () => {
  const feedback = document.querySelector("#copy-feedback");
  try {
    await navigator.clipboard.writeText(APA_CONFIG.pixCode.replace(/\s+/g, ""));
    feedback.textContent = "Código Pix copiado.";
  } catch {
    feedback.textContent = "Não foi possível copiar automaticamente neste navegador.";
  }
});

function setupDocuments() {
  if (!APA_CONFIG.documents.length) return;
  const documentList = document.querySelector("#document-list");
  documentList.replaceChildren();
  APA_CONFIG.documents.forEach((documentInfo) => {
    if (!documentInfo.title || !documentInfo.url) return;
    const link = document.createElement("a");
    link.className = "document-row document-link";
    link.href = documentInfo.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.innerHTML = `<span class="document-type"></span><span class="document-title"></span><span class="document-status">Visualizar ↗</span>`;
    link.querySelector(".document-type").textContent = documentInfo.type || "Documento";
    link.querySelector(".document-title").textContent = documentInfo.title;
    documentList.append(link);
  });
}

function setupFooter() {
  const footerContact = document.querySelector("#footer-contact");
  const links = APA_CONFIG.socialLinks.filter((link) => link.label && link.url).filter((link) => {
    try {
      return new URL(link.url).protocol === "https:";
    } catch {
      return false;
    }
  });
  if (!APA_CONFIG.contact && !links.length) return;

  footerContact.replaceChildren();
  if (APA_CONFIG.contact) {
    const contactText = document.createElement("span");
    contactText.textContent = APA_CONFIG.contact;
    footerContact.append(contactText);
  }
  links.forEach((link) => {
    const socialLink = document.createElement("a");
    socialLink.href = link.url;
    socialLink.target = "_blank";
    socialLink.rel = "noopener noreferrer";
    socialLink.textContent = link.label;
    footerContact.append(socialLink);
  });
}

function setupReveals() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
}

setupPix();
setupDocuments();
setupFooter();
setupReveals();