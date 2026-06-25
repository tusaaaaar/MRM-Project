import axios from 'axios'

import { API_BASE_URL } from '../config';

const UPLOAD_ENDPOINT = `${API_BASE_URL}/upload`
const DATA_QUALITY_ENDPOINT = `${API_BASE_URL}/data-quality`

export async function uploadDataset(file, predictionThreshold, goodThreshold, badThreshold) {
  if (!(file instanceof File)) throw new Error('A valid file must be provided for upload.')
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('prediction_threshold', predictionThreshold)
  formData.append('good_threshold', goodThreshold)
  formData.append('bad_threshold', badThreshold)

  try {
    const response = await axios.post(UPLOAD_ENDPOINT, formData, { headers: { 'Content-Type': 'multipart/form-data' }})
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail) ? detail.map((item) => item.msg ?? JSON.stringify(item)).join(', ') : typeof detail === 'string' ? detail : error.message
      throw new Error(message || 'Failed to upload dataset.')
    }
    throw new Error('An unexpected error occurred while uploading the dataset.')
  }
}

export async function uploadDataQuality(file) {
  if (!(file instanceof File)) throw new Error('A valid file must be provided for upload.')

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await axios.post(DATA_QUALITY_ENDPOINT, formData, { headers: { 'Content-Type': 'multipart/form-data' }})
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail) ? detail.map((item) => item.msg ?? JSON.stringify(item)).join(', ') : typeof detail === 'string' ? detail : error.message
      throw new Error(message || 'Failed to run data quality assessment.')
    }
    throw new Error('An unexpected error occurred during data quality assessment.')
  }
}

export async function downloadExecutivePDF(resultData) {
  const response = await fetch(`${API_BASE_URL}/export-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resultData),
  });

  if (!response.ok) throw new Error('Failed to generate PDF');

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Executive_Audit_Report.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ── NEW: Single Feature Dossier Generator ──
export async function generateFeatureDossier(payload) {
  const response = await fetch(`${API_BASE_URL}/generate-dossier`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to generate dossier on-demand');
  return await response.json();
}

// ── UPDATED: Added Persona to Chat Payload ──
export async function sendChatMessage(messages, contextSummary, persona) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      messages: messages, 
      context_summary: contextSummary,
      persona: persona 
    }),
  });

  if (!response.ok) throw new Error('Failed to connect to Auditor Copilot');
  return await response.json();
}