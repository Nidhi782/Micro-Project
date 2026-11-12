// JsonPowerDB connection details for this project.
const JPDB = {
  url: 'https://api.login2explore.com:5577/api',
  token: window.JPDB_CONFIG?.token || '',
  database: 'COLLEGE-DB',
  relation: 'PROJECT-TABLE'
};

const form = document.querySelector('#project-form');
const projectId = document.querySelector('#project-id');
const dataFields = [...form.querySelectorAll('input:not(#project-id)')];
const saveButton = document.querySelector('#save-button');
const updateButton = document.querySelector('#update-button');
const resetButton = document.querySelector('#reset-button');
const toast = document.querySelector('#toast');
let mode = 'lookup';
let recordNumber = null;
let lookupPending = false;
let toastTimer;
let lookupTimer;

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}

function setDisabled(element, disabled) {
  element.disabled = disabled;
}

function setButtons({ save = false, update = false, reset = false } = {}) {
  setDisabled(saveButton, !save);
  setDisabled(updateButton, !update);
  setDisabled(resetButton, !reset);
}

function setDataFieldsDisabled(disabled) {
  dataFields.forEach((field) => setDisabled(field, disabled));
}

function resetForm() {
  clearTimeout(lookupTimer);
  lookupTimer = null;
  form.reset();
  [projectId, ...dataFields].forEach((field) => { field.value = ''; });
  projectId.disabled = false;
  setDataFieldsDisabled(true);
  setButtons();
  mode = 'lookup';
  recordNumber = null;
  lookupPending = false;
  projectId.focus();
}

async function jpdbRequest(command, jsonStr, endpoint = '/iml', extra = {}) {
  const response = await fetch(`${JPDB.url}${endpoint}`, {
    method: 'POST',
    // Login2Xplore's browser example posts the JSON request string directly.
    // This avoids an application/json preflight request in browsers.
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: JSON.stringify({
      token: JPDB.token,
      dbName: JPDB.database,
      rel: JPDB.relation,
      cmd: command,
      ...extra,
      ...(jsonStr === undefined ? {} : { jsonStr })
    })
  });
  const raw = await response.text();
  let result;
  try { result = JSON.parse(raw); } catch { throw new Error('JsonPowerDB returned an unreadable response.'); }
  if (!response.ok || result.status !== 200) {
    const message = result.message || `JsonPowerDB request failed (${result.status || response.status}).`;
    const error = new Error(message);
    error.status = result.status || response.status;
    throw error;
  }
  return result;
}

async function findProject(id) {
  const response = await jpdbRequest('GET_BY_KEY', { 'Project-ID': id }, '/irl', { createTime: false, updateTime: false });
  return response.data;
}

function parseNestedJson(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function normalizeLookupResult(data) {
  const parsed = parseNestedJson(data);
  if (!parsed || typeof parsed !== 'object') return null;
  const record = parseNestedJson(parsed.record ?? parsed);
  if (!record || typeof record !== 'object') return null;
  return {
    record,
    recordNumber: parsed.rec_no ?? parsed.recNo ?? null
  };
}

async function lookupProject() {
  const id = projectId.value.trim();
  if (!id || lookupPending || mode !== 'lookup') return;
  lookupPending = true;
  projectId.disabled = true;
  try {
    const data = await findProject(id);
    const result = normalizeLookupResult(data);
    const record = result?.record;
    if (record && record['Project-ID'] !== undefined) {
      recordNumber = result.recordNumber;
      projectId.value = record['Project-ID'];
      dataFields.forEach((field) => { field.value = record[field.name] || ''; });
      mode = 'update';
      projectId.disabled = true;
      setDataFieldsDisabled(false);
      setButtons({ update: true, reset: true });
      showToast('Project found. You can update its details.');
    } else {
      mode = 'save';
      projectId.disabled = false;
      setDataFieldsDisabled(false);
      setButtons({ save: true, reset: true });
      showToast('This ID is available. Add the project details.');
    }
    dataFields[0].focus();
  } catch (error) {
    // JPDB reports a missing key or relation as status 400; treat that as a new record.
    if (error.status === 400 && /database|record|data|relation|key|not found|does not exist|no record/i.test(error.message)) {
      mode = 'save';
      projectId.disabled = false;
      setDataFieldsDisabled(false);
      setButtons({ save: true, reset: true });
      dataFields[0].focus();
      showToast('This ID is available. Add the project details.');
    } else {
      projectId.disabled = false;
      mode = 'lookup';
      projectId.focus();
      showToast(`Could not check this Project ID: ${error.message}`, true);
    }
  } finally {
    lookupPending = false;
  }
}

function validateForm() {
  for (const field of [projectId, ...dataFields]) {
    if (!field.value.trim()) {
      field.focus();
      field.reportValidity();
      showToast(`Please complete ${field.labels[0].textContent.replace('*', '').trim()}.`, true);
      return false;
    }
  }
  const assignment = document.querySelector('#assignment-date').value;
  const deadline = document.querySelector('#deadline').value;
  if (deadline < assignment) {
    document.querySelector('#deadline').focus();
    showToast('Deadline must be on or after the assignment date.', true);
    return false;
  }
  return true;
}

function collectData() {
  return Object.fromEntries([projectId, ...dataFields].map((field) => [field.name, field.value.trim()]));
}

async function saveProject() {
  if (mode !== 'save' || !validateForm()) return;
  saveButton.disabled = true;
  try {
    await jpdbRequest('SET', collectData(), '/iml/set', { type: 'PUT', primaryKey: 'Project-ID' });
    showToast('Project saved successfully.');
    resetForm();
  } catch (error) {
    showToast(`Could not save project: ${error.message}`, true);
    saveButton.disabled = false;
  }
}

async function updateProject() {
  if (mode !== 'update' || !validateForm()) return;
  updateButton.disabled = true;
  try {
    if (recordNumber !== null) {
      const changes = Object.fromEntries(dataFields.map((field) => [field.name, field.value.trim()]));
      await jpdbRequest('UPDATE', { [String(recordNumber)]: changes });
    } else {
      // Fallback for JPDB responses that omit rec_no: SET updates by primary key.
      await jpdbRequest('SET', collectData(), '/iml/set', { type: 'UPDATE', primaryKey: 'Project-ID' });
    }
    showToast('Project updated successfully.');
    resetForm();
  } catch (error) {
    showToast(`Could not update project: ${error.message}`, true);
    updateButton.disabled = false;
  }
}

projectId.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    lookupProject();
  }
});
projectId.addEventListener('input', () => {
  clearTimeout(lookupTimer);
  mode = 'lookup';
  recordNumber = null;
  dataFields.forEach((field) => { field.value = ''; });
  setDataFieldsDisabled(true);
  setButtons();
  const id = projectId.value.trim();
  if (id) lookupTimer = setTimeout(lookupProject, 650);
});
projectId.addEventListener('blur', () => {
  if (projectId.value.trim() && mode === 'lookup') {
    clearTimeout(lookupTimer);
    lookupProject();
  }
});
saveButton.addEventListener('click', saveProject);
updateButton.addEventListener('click', updateProject);
resetButton.addEventListener('click', resetForm);
form.addEventListener('submit', (event) => event.preventDefault());
window.addEventListener('DOMContentLoaded', resetForm);
