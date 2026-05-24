// ===== Modal Helpers =====

export function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}
