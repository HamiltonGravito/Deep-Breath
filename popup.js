function loadI18n() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  });
  document.documentElement.lang = chrome.i18n.getUILanguage();
}

loadI18n();

const buttons = document.querySelectorAll('.level-btn');

chrome.storage.local.get(['breathLevel'], (result) => {
  const currentLevel = result.breathLevel || 'medium';
  updateActiveButton(currentLevel);
});

buttons.forEach(button => {
  button.addEventListener('click', () => {
    const level = button.dataset.level;
    chrome.storage.local.set({ breathLevel: level });
    updateActiveButton(level);
  });
});

function updateActiveButton(level) {
  buttons.forEach(btn => {
    if (btn.dataset.level === level) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
